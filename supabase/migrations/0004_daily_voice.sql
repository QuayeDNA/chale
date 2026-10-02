-- supabase/migrations/0004_daily_voice.sql
insert into storage.buckets (id, name, public) values ('voice-clips', 'voice-clips', false)
on conflict (id) do nothing;

create table if not exists voice_listens (
  answer_id uuid not null references answers (id) on delete cascade,
  listener_id uuid not null references users (id) on delete cascade,
  listened_at timestamptz not null default now(),
  primary key (answer_id, listener_id)
);
alter table voice_listens enable row level security;
create policy "listens_read_own" on voice_listens for select
  using (listener_id = auth.uid() or exists (
    select 1 from answers a join prompts p on p.id = a.prompt_id
    where a.id = voice_listens.answer_id
      and exists (select 1 from connection_member_ids(p.connection_id) as m where m = auth.uid())));
create policy "listens_insert_own" on voice_listens for insert with check (listener_id = auth.uid());
grant select, insert on table voice_listens to authenticated;

create or replace function get_or_create_today_prompt(p_connection uuid)
returns table (out_prompt uuid, out_question uuid, out_text text, out_kind question_kind, out_reveal_state reveal_state)
language plpgsql security definer set search_path = public as $$
declare v_prompt prompts%rowtype; v_q questions%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from connection_member_ids(p_connection) as m where m = auth.uid()) then
    raise exception 'not a member of this connection';
  end if;
  select * into v_prompt from prompts where connection_id = p_connection and date = current_date;
  if not found then
    select q.* into v_q from questions q
    where not exists (select 1 from prompts p join questions q2 on q2.id = p.question_id
      where p.connection_id = p_connection and q2.id = q.id)
    order by random() limit 1;
    if not found then select * into v_q from questions order by random() limit 1; end if;
    insert into prompts (connection_id, question_id, date)
    values (p_connection, v_q.id, current_date)
    returning * into v_prompt;
  end if;
  return query select v_prompt.id, v_prompt.question_id, (select text from questions where id = v_prompt.question_id),
    (select kind from questions where id = v_prompt.question_id), v_prompt.reveal_state;
end;
$$;

create or replace function record_listen(p_answer uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into voice_listens (answer_id, listener_id) values (p_answer, auth.uid())
  on conflict do nothing;
end;
$$;

create or replace function save_own_clip(p_answer uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_answer answers%rowtype; v_listen_count int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_answer from answers where id = p_answer;
  if not found then raise exception 'answer not found'; end if;
  if v_answer.user_id <> auth.uid() then raise exception 'only speaker can save'; end if;
  if v_answer.kind <> 'voice' then raise exception 'text answers do not expire'; end if;
  select count(*) into v_listen_count from voice_listens where answer_id = p_answer;
  if v_listen_count < 2 then raise exception 'both must listen first'; end if;
  update answers set expiry_state = 'saved', saved_at = now() where id = p_answer;
end;
$$;

grant execute on function get_or_create_today_prompt(uuid) to authenticated;
grant execute on function record_listen(uuid) to authenticated;
grant execute on function save_own_clip(uuid) to authenticated;

create policy "voice_upload_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-clips');
create policy "voice_read_member" on storage.objects for select to authenticated
  using (bucket_id = 'voice-clips');
