-- Chale — deck identity, bounded sessions, and the daily-prompt relationship fix.
--
-- Why this exists: a single flat 100-question pack read as an endless chore
-- ("07/100"), was always walked in created_at order, and the board's six
-- themed decks were never seeded. This migration gives decks a real identity,
-- makes a session a bounded shuffled draw instead of a full walk, and stops
-- the remote daily prompt from serving partner questions to friends.
--
-- Design rule that keeps this extensible: the database stores KEYS
-- (slug, tone, icon, art_key); the app owns the rendering. A new themed deck
-- with its own card treatment is therefore one row here plus one entry in
-- src/decks/art.ts — no migration per deck, and no React in the database.

-- ============ Deck identity ============

alter table question_packs
  add column slug text,
  add column tagline text,
  add column icon text not null default 'sparkles',
  add column tone text not null default 'deep',
  add column art_key text not null default 'default',
  add column session_length int not null default 20
    check (session_length between 5 and 50),
  add column sort_order int not null default 0,
  add column is_published boolean not null default false;

create unique index uq_question_packs_slug
  on question_packs (slug) where slug is not null;

-- `category` was free text, unindexed, unconstrained, and only ever set to
-- 'core' by the 0002 seed. slug + tone + is_published supersede it entirely.
alter table question_packs drop column category;

create index idx_question_packs_published
  on question_packs (sort_order) where is_published;

-- ============ Authored question order ============
--
-- Ordering previously fell back to created_at, which is unindexed and
-- meaningless as an editorial sequence. `ordinal` is the authored position;
-- it stays nullable so a partially-authored deck is still drawable.

alter table questions
  add column ordinal int,
  add column is_active boolean not null default true;

-- Backfill the existing pack so no question is left unordered.
with ranked as (
  select id, row_number() over (partition by pack_id order by created_at, id) as rn
  from questions
)
update questions q set ordinal = ranked.rn from ranked where q.id = ranked.id;

create unique index uq_questions_pack_ordinal
  on questions (pack_id, ordinal) where ordinal is not null;

-- Covers the hot path: one pack's active questions in authored order.
create index idx_questions_pack_active
  on questions (pack_id, ordinal) where is_active;

-- ============ Bounded session draw ============
--
-- Replaces the client-side full-table walk in src/app/session.tsx. Returns a
-- shuffled subset so a session is finishable (20 by default) and never repeats
-- the same order twice. SECURITY INVOKER so the existing read policies apply
-- and guests can play in-person without an account.

create or replace function draw_session_questions(p_pack uuid, p_count int default 20)
returns table (id uuid, text text, kind question_kind, ordinal int)
language sql
stable
security invoker
set search_path = public
as $$
  select q.id, q.text, q.kind, q.ordinal
  from questions q
  join question_packs p on p.id = q.pack_id
  where q.pack_id = p_pack
    and q.is_active
    and p.is_published
  order by random()
  limit least(greatest(coalesce(p_count, 20), 1), 50);
$$;

grant execute on function draw_session_questions(uuid, int) to anon, authenticated;

-- ============ Deck list with counts ============
--
-- src/app/(tabs)/home.tsx was issuing one exact head-count query per deck
-- tile (N+1). One round trip replaces the lot.

create or replace function list_packs_with_counts()
returns table (
  id uuid,
  slug text,
  title text,
  tagline text,
  icon text,
  tone text,
  art_key text,
  relationship_type relationship_type,
  session_length int,
  sort_order int,
  question_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.title,
    p.tagline,
    p.icon,
    p.tone,
    p.art_key,
    p.relationship_type,
    p.session_length,
    p.sort_order,
    count(q.id) filter (where q.is_active) as question_count
  from question_packs p
  left join questions q on q.pack_id = p.id
  where p.is_published
  group by p.id
  order by p.sort_order, p.created_at;
$$;

grant execute on function list_packs_with_counts() to anon, authenticated;

-- ============ Daily prompt: relationship-scoped ============
--
-- BUG FIX. The original picked `from questions order by random()` with no join
-- to question_packs at all, so a 'friend' or 'family' connection was served
-- partner-pack content. Now the draw is scoped to the connection's own
-- relationship_type and to published decks, with a relaxed fallback so a
-- connection whose decks are still unpublished (empty beta, content work in
-- flight) degrades to any active question rather than erroring.

create or replace function get_or_create_today_prompt(p_connection uuid)
returns table (
  out_prompt uuid,
  out_question uuid,
  out_text text,
  out_kind question_kind,
  out_reveal_state reveal_state
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prompt prompts%rowtype;
  v_q questions%rowtype;
  v_relationship relationship_type;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  if not exists (
    select 1 from connection_member_ids(p_connection) as m where m = auth.uid()
  ) then
    raise exception 'not a member of this connection';
  end if;

  select c.relationship_type into v_relationship
  from connections c
  where c.id = p_connection;

  select * into v_prompt
  from prompts
  where connection_id = p_connection and date = current_date;

  if not found then
    -- Prefer an unseen question from a published deck matching this
    -- connection's relationship type.
    select q.* into v_q
    from questions q
    join question_packs p on p.id = q.pack_id
    where q.is_active
      and p.is_published
      and p.relationship_type = v_relationship
      and not exists (
        select 1
        from prompts pr
        join questions q2 on q2.id = pr.question_id
        where pr.connection_id = p_connection and q2.id = q.id
      )
    order by random()
    limit 1;

    -- Fall back to any unseen active question.
    if not found then
      select q.* into v_q
      from questions q
      where q.is_active
        and not exists (
          select 1
          from prompts pr
          join questions q2 on q2.id = pr.question_id
          where pr.connection_id = p_connection and q2.id = q.id
        )
      order by random()
      limit 1;
    end if;

    -- Last resort: the pool is exhausted, reuse a question rather than 500.
    if not found then
      select q.* into v_q
      from questions q
      where q.is_active
      order by random()
      limit 1;
    end if;

    if not found then
      raise exception 'no questions available';
    end if;

    insert into prompts (connection_id, question_id, date)
    values (p_connection, v_q.id, current_date)
    returning * into v_prompt;
  end if;

  return query
    select
      v_prompt.id,
      v_prompt.question_id,
      (select text from questions where id = v_prompt.question_id),
      (select kind from questions where id = v_prompt.question_id),
      v_prompt.reveal_state;
end;
$$;

grant execute on function get_or_create_today_prompt(uuid) to authenticated;
