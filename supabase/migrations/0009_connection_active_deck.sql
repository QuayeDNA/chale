-- 0009: pin the chosen deck to a connection.
--
-- Until now a deck only ever mattered in person. Picking a deck and then
-- choosing "send it remotely" silently dropped the deck: /start does the
-- pairing flow and the daily prompt was drawn by relationship_type alone,
-- so Deep Talks -> remote quietly handed you a Love & Relationships
-- question. This migration gives a connection an active deck and makes the
-- daily draw prefer it.
--
-- On delete set null, not cascade: retiring or unpublishing a deck must
-- never destroy somebody's relationship history. A null deck degrades to
-- the relationship-type behaviour that shipped in 0007.

-- ============ connections.active_deck_id ============

alter table connections
  add column if not exists active_deck_id uuid references question_packs (id) on delete set null;

create index if not exists idx_connections_active_deck
  on connections (active_deck_id)
  where active_deck_id is not null;

-- ============ create_connection(p_deck) ============
--
-- The inviter's deck wins. join_connection is deliberately left alone, so
-- whoever generates the code decides the deck and the joiner inherits it.
-- That avoids a "who overwrote whom" rule when both sides picked something
-- different, and it is unambiguous without an extra column.

drop function if exists create_connection();

create or replace function create_connection(p_deck uuid default null)
returns table (out_id uuid, out_invite_code text)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  -- A pinned deck must be one we actually publish, otherwise the daily draw
  -- would fall straight through to the relationship-type default.
  if p_deck is not null and not exists (
    select 1 from question_packs p
    where p.id = p_deck and p.is_published
  ) then
    raise exception 'unknown deck';
  end if;

  v_code := make_invite_code();
  insert into connections (user_a_id, invite_code, status, relationship_type, active_deck_id)
  values (auth.uid(), v_code, 'pending', 'partner', p_deck)
  returning id, invite_code into v_id, v_code;
  return query select v_id, v_code;
end;
$$;

grant execute on function create_connection(uuid) to authenticated;

-- ============ daily prompt prefers the pinned deck ============

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
  v_deck uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  if not exists (
    select 1 from connection_member_ids(p_connection) as m where m = auth.uid()
  ) then
    raise exception 'not a member of this connection';
  end if;

  select c.relationship_type, c.active_deck_id into v_relationship, v_deck
  from connections c
  where c.id = p_connection;

  select * into v_prompt
  from prompts
  where connection_id = p_connection and date = current_date;

  if not found then
    -- The deck the pair picked when they connected.
    if v_deck is not null then
      select q.* into v_q
      from questions q
      where q.is_active
        and q.pack_id = v_deck
        and not exists (
          select 1
          from prompts pr
          join questions q2 on q2.id = pr.question_id
          where pr.connection_id = p_connection and q2.id = q.id
        )
      order by random()
      limit 1;

      -- The pinned deck is exhausted. Keep serving from it rather than
      -- silently switching tone mid-relationship; reuse below covers it.
      if not found then
        select q.* into v_q
        from questions q
        where q.is_active and q.pack_id = v_deck
        order by random()
        limit 1;
      end if;
    end if;

    -- Fall back to an unseen question from a published deck matching this
    -- connection's relationship type.
    if not found then
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
    end if;

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