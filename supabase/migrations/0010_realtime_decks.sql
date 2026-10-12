-- Realtime for the deck catalogue.
--
-- A postgres_changes subscription delivers nothing unless its table is a member
-- of the supabase_realtime publication, and no migration had added any table to
-- it. The prompt screen already subscribes to prompts/answers, so that hook was
-- listening to a channel that never carried a payload; home needs the same for
-- decks so a newly published deck (or a renamed one) appears without a reload.

do $$
declare
  t text;
begin
  foreach t in array array['question_packs', 'questions', 'prompts', 'answers'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;