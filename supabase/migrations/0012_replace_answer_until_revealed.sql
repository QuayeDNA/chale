-- supabase/migrations/0012_replace_answer_until_revealed.sql
-- Lets someone change their answer while the day is still open.
--
-- submit_answer (0005) ends in `on conflict (prompt_id, user_id) do nothing`,
-- so a second submit for the same prompt was silently discarded. That made the
-- remote flow's "Change your answer" control a lie: the copy said you could
-- take it back, and the database quietly kept the first one.
--
-- The rule this encodes: an answer is yours to replace until the pair has both
-- answered. The moment reveal_state flips to 'revealed' the answer is a shared
-- memory, so replacing it afterwards would mean one person rewrote what the
-- other already read. That is refused here rather than in the UI, because the
-- UI is not the only caller.

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

  if exists (
    select 1 from prompts
    where id = p_prompt and reveal_state = 'revealed'
  ) then
    raise exception 'this answer has been revealed and can no longer be changed';
  end if;

  -- Replacing rather than ignoring. Every field moves to the new answer:
  -- a text answer swapped for a voice one has to clear the text expiry, and a
  -- voice clip swapped for another is a different clip that starts its own
  -- seven days, so saved_at has to go too.
  insert into answers (prompt_id, user_id, kind, content, expires_at)
  values (p_prompt, auth.uid(), p_kind, p_content,
    case when p_kind = 'voice' then now() + interval '7 days' else null end)
  on conflict (prompt_id, user_id) do update
    set kind = excluded.kind,
        content = excluded.content,
        expires_at = excluded.expires_at,
        submitted_at = now(),
        expiry_state = 'active',
        saved_at = null;

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