-- supabase/migrations/0003_pairing.sql
-- Chale pairing: create + join by invite code. RPC-only, no direct client INSERT.
create or replace function make_invite_code() returns text
language plpgsql as $$
declare v text;
begin
  loop
    v := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    v := regexp_replace(v, '[^A-Z0-9]', 'A', 'g');
    if length(v) = 6 and not exists (select 1 from connections where invite_code = v) then
      return v;
    end if;
  end loop;
end;
$$;

create or replace function create_connection()
returns table (out_id uuid, out_invite_code text)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  v_code := make_invite_code();
  insert into connections (user_a_id, invite_code, status, relationship_type)
  values (auth.uid(), v_code, 'pending', 'partner')
  returning id, invite_code into v_id, v_code;
  return query select v_id, v_code;
end;
$$;

create or replace function join_connection(p_code text)
returns table (out_id uuid, out_status connection_status)
language plpgsql security definer set search_path = public as $$
declare v_row connections%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_row from connections where invite_code = upper(trim(p_code));
  if not found then raise exception 'code not found'; end if;
  if v_row.status = 'linked' then raise exception 'already linked'; end if;
  if v_row.user_a_id = auth.uid() then raise exception 'cannot join own invite'; end if;
  update connections set user_b_id = auth.uid(), status = 'linked', updated_at = now()
  where id = v_row.id returning * into v_row;
  return query select v_row.id, v_row.status;
end;
$$;

grant execute on function create_connection() to authenticated;
grant execute on function join_connection(text) to authenticated;
