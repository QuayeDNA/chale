-- ============ favourites ============
-- In-person sessions let either player heart a question; list lives here.

create table favourites (
  user_id     uuid not null references users (id) on delete cascade,
  question_id uuid not null references questions (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint pk_favourites primary key (user_id, question_id)
);

alter table favourites enable row level security;

create policy "favourites_own_read"
  on favourites for select
  using (user_id = auth.uid());

create policy "favourites_own_write"
  on favourites for insert
  with check (user_id = auth.uid());

create policy "favourites_own_delete"
  on favourites for delete
  using (user_id = auth.uid());

grant select, insert, delete on table favourites to authenticated;
