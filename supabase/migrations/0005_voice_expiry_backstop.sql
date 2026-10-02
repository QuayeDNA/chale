-- supabase/migrations/0005_voice_expiry_backstop.sql
-- 7-day expiry backstop (Global Constraint): voice answers now get
-- expires_at = now() + 7 days at insert time. Text answers keep null.
-- Replaces submit_answer from 0001_initial_schema.sql verbatim except for
-- the expires_at column on insert; reveal logic untouched.

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

  insert into answers (prompt_id, user_id, kind, content, expires_at)
  values (p_prompt, auth.uid(), p_kind, p_content,
    case when p_kind = 'voice' then now() + interval '7 days' else null end)
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

-- Backfill pre-existing voice rows that were inserted without expires_at.
update answers
set expires_at = submitted_at + interval '7 days'
where kind = 'voice' and expires_at is null;
