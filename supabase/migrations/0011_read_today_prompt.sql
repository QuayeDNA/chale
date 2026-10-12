-- ============ read-only peek at today's prompt ============
--
-- `get_or_create_today_prompt` assigns a question when there is not one yet.
-- That is right for the Remote tab, where answering is the whole point of
-- arriving, but wrong for Home: merely opening the dashboard should not burn
-- the day, and should certainly not claim a question "arrived" when nobody
-- sent it.
--
-- This returns today's row only if one already exists, and is `security
-- invoker` so the `prompts_read_own` policy still checks membership. Zero
-- rows means the day has not been drawn yet, which the client reads as null.

create or replace function read_today_prompt(p_connection uuid)
returns table (
  out_prompt uuid,
  out_question uuid,
  out_text text,
  out_kind question_kind,
  out_reveal_state reveal_state
)
language sql
stable
security invoker
set search_path = public
as $$
  select p.id, p.question_id, q.text, q.kind, p.reveal_state
  from prompts p
  join questions q on q.id = p.question_id
  where p.connection_id = p_connection
    and p.date = current_date;
$$;

grant execute on function read_today_prompt(uuid) to authenticated;