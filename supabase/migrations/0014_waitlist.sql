-- Chale - beta waitlist.
-- Public signup happens through the `join-waitlist` Edge Function. The table
-- is intentionally locked down: only the service role reads or writes it.
-- Double opt-in uses a hashed, expiring token; raw tokens never hit the DB.

create table if not exists public.waitlist (
  id                      uuid primary key default gen_random_uuid(),
  email                   text not null unique,
  status                  text not null default 'pending'
                            check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirm_token_hash      text,
  confirm_token_expires_at timestamptz,
  confirmed_at            timestamptz,
  unsubscribed_at         timestamptz,
  invite_code             text not null unique
                            default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  referred_by             text,
  relationship_type       text
                            check (relationship_type in ('partner', 'family', 'friend')),
  platform                text
                            check (platform in ('android', 'ios', 'web', 'unknown')),
  source                  text,
  utm_source              text,
  utm_medium              text,
  utm_campaign            text,
  utm_content             text,
  utm_term                text,
  referrer                text,
  ip_hash                 text,
  email_sent_at           timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.waitlist is
  'Beta waitlist. Written only by the join-waitlist Edge Function.';
comment on column public.waitlist.confirm_token_hash is
  'SHA-256 of the single-use confirmation token; the raw token is emailed.';
comment on column public.waitlist.invite_code is
  'Shareable code used to attribute a referred signup (?ref=...).';

create index if not exists waitlist_ip_created_idx
  on public.waitlist (ip_hash, created_at desc);

create index if not exists waitlist_referred_by_idx
  on public.waitlist (referred_by);

create index if not exists waitlist_confirm_token_idx
  on public.waitlist (confirm_token_hash)
  where confirm_token_hash is not null;

alter table public.waitlist enable row level security;

-- No anon/authenticated policies. The Edge Function uses the service role.
revoke all on public.waitlist from anon, authenticated;
grant select, insert, update, delete on public.waitlist to service_role;
