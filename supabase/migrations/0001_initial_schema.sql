-- Chale — initial schema.
-- Implements the data model and reveal logic from docs/02-technical-architecture.md (§3, §4).
-- Apply via Supabase CLI (`supabase db push`) or the SQL editor.
--
-- Key design points:
--  * The reveal rule is enforced in the database (submit_answer RPC), never on the client.
--  * RLS only lets a member read the partner's answer once the prompt is 'revealed'.
--  * MVP exposes only the 'partner' relationship type; the schema supports more from day one.

-- ============ Enums ============

create type relationship_type as enum ('partner', 'friend', 'family');
create type connection_status as enum ('pending', 'linked');
create type question_kind as enum ('text', 'voice', 'either');
create type answer_kind as enum ('text', 'voice');
create type reveal_state as enum ('waiting_on_both', 'revealed');
create type expiry_state as enum ('active', 'expired', 'saved');

grant usage on type relationship_type, connection_status, question_kind, answer_kind, reveal_state, expiry_state
  to anon, authenticated, service_role;

-- ============ users ============

-- id ties directly to Supabase Auth; a matching `users` row is created for
-- every signed-up account (client-side after signup, or via a trigger).
create table users (
  id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url  text,
  push_token  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============ connections ============

create table connections (
  id               uuid primary key default gen_random_uuid(),
  user_a_id        uuid not null references users (id) on delete cascade,
  user_b_id        uuid references users (id) on delete cascade,
  relationship_type relationship_type not null default 'partner',
  invite_code      text not null unique,
  status           connection_status not null default 'pending',
  streak_count     int not null default 0,
  longest_streak   int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_connection_distinct check (user_a_id is distinct from user_b_id)
);

-- A given pair can have only one linked connection, regardless of which side is A or B.
create unique index uq_connections_linked_pair
  on connections (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id))
  where status = 'linked';

-- ============ question_packs ============

create table question_packs (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  category          text,
  relationship_type relationship_type not null default 'partner',
  created_at        timestamptz not null default now()
);

-- ============ questions ============

create table questions (
  id       uuid primary key default gen_random_uuid(),
  pack_id  uuid not null references question_packs (id) on delete cascade,
  text     text not null,
  kind     question_kind not null default 'either',
  created_at timestamptz not null default now()
);

-- ============ prompts ============

-- One row per question-instance sent to a specific connection on a specific day.
create table prompts (
  id            uuid primary key default gen_random_uuid(),
  connection_id uuid not null references connections (id) on delete cascade,
  question_id   uuid not null references questions (id),
  date          date not null,
  reveal_state  reveal_state not null default 'waiting_on_both',
  created_at    timestamptz not null default now(),
  constraint uq_prompt_connection_date unique (connection_id, date)
);

-- ============ answers ============

create table answers (
  id            uuid primary key default gen_random_uuid(),
  prompt_id     uuid not null references prompts (id) on delete cascade,
  user_id       uuid not null references users (id) on delete cascade,
  kind          answer_kind not null,
  content       text not null,  -- text answer, or audio file URL for voice
  submitted_at  timestamptz not null default now(),
  expiry_state  expiry_state not null default 'active',
  expires_at    timestamptz,  -- null for text answers
  saved_at      timestamptz,
  created_at    timestamptz not null default now(),
  constraint uq_answer_prompt_user unique (prompt_id, user_id),
  constraint chk_text_no_expiry check (kind = 'voice' or (kind = 'text' and expires_at is null))
);

create index idx_prompts_connection on prompts (connection_id);
create index idx_answers_prompt on answers (prompt_id);
create index idx_questions_pack on questions (pack_id);

-- ============ Row Level Security ============

alter table users         enable row level security;
alter table connections   enable row level security;
alter table question_packs enable row level security;
alter table questions     enable row level security;
alter table prompts       enable row level security;
alter table answers       enable row level security;

-- Shared helper: the uuids of both members of a connection.
-- SECURITY DEFINER so the RLS policies below can use it without recursion.
create or replace function connection_member_ids(p_connection uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_a_id from connections where id = p_connection
  union
  select user_b_id from connections where id = p_connection and user_b_id is not null
$$;

-- users: manage own profile only.
create policy "users_read_own"   on users for select using (auth.uid() = id);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);

-- question content is not sensitive: readable by anyone.
create policy "question_packs_read" on question_packs for select using (true);
create policy "questions_read"      on questions      for select using (true);

create policy "connections_read_own" on connections for select
  using (user_a_id = auth.uid() or user_b_id = auth.uid());

create policy "prompts_read_own" on prompts for select
  using (exists (select 1 from connection_member_ids(prompts.connection_id) as m where m = auth.uid()));

-- Own answers always readable; a partner's answer only once the prompt is revealed.
-- This mechanically enforces the reveal mechanic at the data layer.
create policy "answers_read" on answers for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from prompts p
      where p.id = answers.prompt_id
        and p.reveal_state = 'revealed'
        and exists (select 1 from connection_member_ids(p.connection_id) as m where m = auth.uid())
    )
  );

-- ============ Reveal logic (server-side, non-negotiable) ============

-- Submits the caller's answer to a prompt and atomically flips the prompt to
-- 'revealed' once both members have answered. SECURITY DEFINER so RLS never
-- interferes; the membership + auth checks below are the gate. A user cannot
-- resubmit (first answer wins — answers are never editable, per 04-user-flows.md).
create or replace function submit_answer(
  p_prompt uuid,
  p_kind   answer_kind,
  p_content text
) returns table (out_prompt uuid, out_reveal_state reveal_state)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_connection uuid;
  v_answer_count int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select connection_id into v_connection
  from prompts
  where id = p_prompt;

  if v_connection is null then
    raise exception 'prompt not found';
  end if;

  if not exists (select 1 from connection_member_ids(v_connection) as m where m = auth.uid()) then
    raise exception 'not a member of this connection';
  end if;

  insert into answers (prompt_id, user_id, kind, content)
  values (p_prompt, auth.uid(), p_kind, p_content)
  on conflict (prompt_id, user_id) do nothing;

  select count(*) into v_answer_count
  from answers
  where prompt_id = p_prompt;

  if v_answer_count >= 2 then
    update prompts
    set reveal_state = 'revealed'
    where id = p_prompt
      and reveal_state <> 'revealed';
  end if;

  return query
    select p_prompt, reveal_state
    from prompts
    where id = p_prompt;
end;
$$;

grant execute on function submit_answer(uuid, answer_kind, text) to authenticated;

-- ============ Notes on what is intentionally NOT here yet ============
-- Pairing (invite code -> link), the daily-question scheduler, voice clip
-- expiry/listen tracking, and push notification hooks arrive in later
-- migrations, as their owning flows are built.