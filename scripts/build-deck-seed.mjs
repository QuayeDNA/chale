// Generates the deck seed migrations from content/decks/*.json.
//
// The JSON files are the authoring surface — a deck (copy, tone, icon, art key,
// and its questions) lives in exactly one file and never needs a migration.
// Free decks are written to 0008_seed_decks.sql; locked / coming-soon packs are
// written to 0013_locked_decks.sql, which also adds the is_locked flag and
// re-creates the draw RPCs so a locked pack can be browsed but never played.
//
// Run after editing any deck, then commit the regenerated SQL alongside it:
//
//   node scripts/build-deck-seed.mjs            # write both migrations
//   node scripts/build-deck-seed.mjs --check    # fail if either is stale
//
// Zero dependencies on purpose: this is a build-time text transform, so it must
// not be able to break because of a dependency tree.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DECKS_DIR = join(here, '..', 'content', 'decks');
const OUT_FREE = join(here, '..', 'supabase', 'migrations', '0008_seed_decks.sql');
const OUT_LOCKED = join(here, '..', 'supabase', 'migrations', '0013_locked_decks.sql');

const VALID_KINDS = new Set(['text', 'voice', 'either']);
const VALID_RELATIONSHIPS = new Set(['partner', 'family', 'friend']);

// Deck renames keep their row (and any played questions) by moving the slug
// rather than inserting a duplicate. Both sides are emitted into the free seed.
const RENAMES = [
  { from: 'family', to: 'family-table' },
  { from: 'friends', to: 'day-ones' },
];

// Single quotes are the only escape Postgres needs inside a normal string.
const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;

const sqlList = (values) => values.map(lit).join(', ');

function loadDecks() {
  const files = readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json'));
  const decks = files.map((f) => ({
    file: f,
    ...JSON.parse(readFileSync(join(DECKS_DIR, f), 'utf8')),
  }));

  const seenSlugs = new Set();
  for (const deck of decks) {
    const where = deck.file;
    for (const field of [
      'slug',
      'title',
      'tagline',
      'relationship_type',
      'icon',
      'tone',
      'art_key',
      'sort_order',
    ]) {
      if (deck[field] === undefined) throw new Error(`${where}: missing "${field}"`);
    }
    if (!VALID_RELATIONSHIPS.has(deck.relationship_type)) {
      throw new Error(
        `${where}: relationship_type must be one of ${[...VALID_RELATIONSHIPS].join(', ')}`,
      );
    }
    if (deck.is_locked !== undefined && typeof deck.is_locked !== 'boolean') {
      throw new Error(`${where}: is_locked must be a boolean when present`);
    }
    if (seenSlugs.has(deck.slug)) throw new Error(`${where}: duplicate slug "${deck.slug}"`);
    seenSlugs.add(deck.slug);
    if (!Array.isArray(deck.questions) || deck.questions.length === 0) {
      throw new Error(`${where}: questions must be a non-empty array`);
    }

    // Duplicate prompt text across a deck would show the same question twice in
    // one session draw, which reads as a bug to the player.
    const seenText = new Set();
    deck.questions.forEach((q, i) => {
      if (typeof q.text !== 'string' || !q.text.trim())
        throw new Error(`${where}: question ${i + 1} has no text`);
      if (!VALID_KINDS.has(q.kind))
        throw new Error(`${where}: question ${i + 1} kind "${q.kind}" is not text|voice|either`);
      const key = q.text.toLowerCase().replace(/[^a-z ]/g, '');
      if (seenText.has(key)) throw new Error(`${where}: duplicate question text — ${q.text}`);
      seenText.add(key);
    });
  }
  return decks.sort((a, b) => a.sort_order - b.sort_order);
}

function questionInserts(deck) {
  const rows = deck.questions
    .map((q, i) => `  (${i + 1}, ${lit(q.text)}, ${lit(q.kind)})`)
    .join(',\n');
  return `-- ${deck.title} — ${deck.questions.length} questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
${rows}
) as v(ordinal, text, kind)
where p.slug = ${lit(deck.slug)};`;
}

function buildFreeSql(decks) {
  const free = decks.filter((d) => !d.is_locked);
  const totalQuestions = free.reduce((n, d) => n + d.questions.length, 0);
  const slugs = sqlList(free.map((d) => d.slug));

  const renames = RENAMES.flatMap(({ from, to }) => {
    const deck = free.find((d) => d.slug === to);
    if (!deck) return [];
    return `update question_packs
set slug = ${lit(to)},
    title = ${lit(deck.title)},
    tagline = ${lit(deck.tagline)}
where slug = ${lit(from)}
  and not exists (select 1 from question_packs where slug = ${lit(to)});`;
  });

  const header = `-- Chale — the free themed decks, generated from content/decks/*.json.
--
-- DO NOT EDIT BY HAND. Edit the JSON, then run: node scripts/build-deck-seed.mjs
--
-- The flat 100-question 'Partner Pack' from 0002 is SOFT-retired above rather
-- than deleted: prompts.question_id has no ON DELETE action, so deleting it
-- would fail on any database that has already served a prompt. Retiring keeps
-- historical prompts intact and reversible (flip is_published / is_active back).
--
-- ${free.length} free decks, ${totalQuestions} questions:
${free
  .map((d) => `--   ${String(d.questions.length).padStart(3)}  ${d.slug}  (${d.relationship_type})`)
  .join('\n')}
--
-- Locked / coming-soon packs live in 0013_locked_decks.sql so this seed can be
-- re-run without touching them.

-- ============ Soft-retire the legacy flat pack ============

update question_packs
set slug = 'legacy-partner-pack',
    is_published = false,
    tagline = 'Retired flat 100-question pack. Replaced by the themed decks.'
where slug is null;

update questions q
set is_active = false
from question_packs p
where p.slug = 'legacy-partner-pack'
  and q.pack_id = p.id;

-- ============ Renamed decks ============
-- A rename moves the existing row so played prompts and favourites keep their
-- deck; inserting the new slug alone would leave the old row stranded.

${renames.join('\n\n')}

-- ============ Clear any previous run of the free decks ============
-- Runs BEFORE the inserts so a re-run replaces content instead of duplicating
-- it. Question rows are only cleared when nothing references them: prompts keep
-- historical answers alive, and favourites would cascade-delete. A deck that
-- has been played is left alone, so a re-run is safe but not destructive.
-- Locked packs are deliberately outside this list.

do $$
declare
  d record;
begin
  for d in select id, slug from question_packs where slug in (${slugs}) loop
    if not exists (
      select 1 from prompts pr join questions q on q.id = pr.question_id where q.pack_id = d.id
    ) and not exists (
      select 1 from favourites f join questions q on q.id = f.question_id where q.pack_id = d.id
    ) then
      delete from questions where pack_id = d.id;
    else
      raise notice 'deck % has played or favourited questions — leaving existing rows in place', d.slug;
    end if;
  end loop;
end;
$$;

delete from question_packs
where slug = 'legacy-partner-pack'
  and not exists (
    select 1 from prompts pr
    join questions q on q.id = pr.question_id
    where q.pack_id = question_packs.id
  );

-- ============ Free decks ============
-- Upsert on the partial unique slug index so a re-run refreshes deck metadata
-- rather than failing on the unique violation.

insert into question_packs
  (slug, title, tagline, relationship_type, icon, tone, art_key, session_length, sort_order, is_published)
values
${free
  .map(
    (d) =>
      `  (${lit(d.slug)}, ${lit(d.title)}, ${lit(d.tagline)}, ${lit(d.relationship_type)}::relationship_type, ${lit(d.icon)}, ${lit(d.tone)}, ${lit(d.art_key)}, ${d.session_length ?? 20}, ${d.sort_order}, true)`,
  )
  .join(',\n')}
on conflict (slug) where slug is not null do update
set title = excluded.title,
    tagline = excluded.tagline,
    relationship_type = excluded.relationship_type,
    icon = excluded.icon,
    tone = excluded.tone,
    art_key = excluded.art_key,
    session_length = excluded.session_length,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published;
`;

  return `${header}\n${free.map(questionInserts).join('\n\n')}`;
}

function buildLockedSql(decks) {
  const locked = decks.filter((d) => d.is_locked);
  const totalQuestions = locked.reduce((n, d) => n + d.questions.length, 0);
  const slugs = sqlList(locked.map((d) => d.slug));

  const deckInserts = locked.length
    ? `insert into question_packs
  (slug, title, tagline, relationship_type, icon, tone, art_key, session_length, sort_order, is_published, is_locked)
values
${locked
  .map(
    (d) =>
      `  (${lit(d.slug)}, ${lit(d.title)}, ${lit(d.tagline)}, ${lit(d.relationship_type)}::relationship_type, ${lit(d.icon)}, ${lit(d.tone)}, ${lit(d.art_key)}, ${d.session_length ?? 20}, ${d.sort_order}, true, true)`,
  )
  .join(',\n')}
on conflict (slug) where slug is not null do update
set title = excluded.title,
    tagline = excluded.tagline,
    relationship_type = excluded.relationship_type,
    icon = excluded.icon,
    tone = excluded.tone,
    art_key = excluded.art_key,
    session_length = excluded.session_length,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published,
    is_locked = excluded.is_locked;`
    : '-- No locked decks are currently authored.';

  const header = `-- Chale — locked / coming-soon packs, generated from content/decks/*.json.
--
-- DO NOT EDIT BY HAND. Edit the JSON, then run: node scripts/build-deck-seed.mjs
--
-- Locked packs are visible in the catalogue but cannot be drawn. is_locked is a
-- separate flag from is_published on purpose: an unpublished deck is hidden,
-- while a locked deck is a promise the storefront is allowed to show.
--
-- ${locked.length} locked decks, ${totalQuestions} questions:
${locked
  .map((d) => `--   ${String(d.questions.length).padStart(3)}  ${d.slug}  (${d.relationship_type})`)
  .join('\n')}

-- ============ Lock flag ============

alter table question_packs
  add column if not exists is_locked boolean not null default false;

-- ============ Clear any previous run of the locked decks ============
-- Same safety rule as the free seed: never delete a question a prompt or
-- favourite still points at.

do $$
declare
  d record;
begin
  for d in select id, slug from question_packs where slug in (${slugs}) loop
    if not exists (
      select 1 from prompts pr join questions q on q.id = pr.question_id where q.pack_id = d.id
    ) and not exists (
      select 1 from favourites f join questions q on q.id = f.question_id where q.pack_id = d.id
    ) then
      delete from questions where pack_id = d.id;
    else
      raise notice 'deck % has played or favourited questions — leaving existing rows in place', d.slug;
    end if;
  end loop;
end;
$$;

-- ============ Locked decks ============

${deckInserts}
`;

  const rpcs = `-- ============ Read side ============
-- The catalogue needs is_locked so it can render the lock without guessing;
-- the draw paths must ignore locked packs everywhere, including the fallback
-- branches that exist for an empty or exhausted pool.

drop function if exists list_packs_with_counts();

create function list_packs_with_counts()
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
  is_locked boolean,
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
    p.is_locked,
    count(q.id) filter (where q.is_active) as question_count
  from question_packs p
  left join questions q on q.pack_id = p.id
  where p.is_published
  group by p.id
  order by p.sort_order, p.created_at;
$$;

grant execute on function list_packs_with_counts() to anon, authenticated;

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
    and not p.is_locked
  order by random()
  limit least(greatest(coalesce(p_count, 20), 1), 50);
$$;

grant execute on function draw_session_questions(uuid, int) to anon, authenticated;

create or replace function create_connection(p_deck uuid default null)
returns table (out_id uuid, out_invite_code text)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  -- A deck can only be pinned when it is both published and playable.
  if p_deck is not null and not exists (
    select 1 from question_packs p
    where p.id = p_deck and p.is_published and not p.is_locked
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

  -- A deck pinned before it was locked must stop serving immediately.
  if v_deck is not null and exists (
    select 1 from question_packs p where p.id = v_deck and p.is_locked
  ) then
    v_deck := null;
  end if;

  select * into v_prompt
  from prompts
  where connection_id = p_connection and date = current_date;

  if not found then
    -- The deck the pair picked when they connected.
    if v_deck is not null then
      select q.* into v_q
      from questions q
      join question_packs p on p.id = q.pack_id
      where q.is_active
        and p.id = v_deck
        and p.is_published
        and not p.is_locked
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
        join question_packs p on p.id = q.pack_id
        where q.is_active
          and p.id = v_deck
          and p.is_published
          and not p.is_locked
        order by random()
        limit 1;
      end if;
    end if;

    -- Fall back to an unseen question from a playable deck matching this
    -- connection's relationship type.
    if not found then
      select q.* into v_q
      from questions q
      join question_packs p on p.id = q.pack_id
      where q.is_active
        and p.is_published
        and not p.is_locked
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

    -- Fall back to any unseen active question in a playable deck.
    if not found then
      select q.* into v_q
      from questions q
      join question_packs p on p.id = q.pack_id
      where q.is_active
        and p.is_published
        and not p.is_locked
        and not exists (
          select 1
          from prompts pr
          join questions q2 on q2.id = pr.question_id
          where pr.connection_id = p_connection and q2.id = q.id
        )
      order by random()
      limit 1;
    end if;

    -- Last resort: the pool is exhausted, reuse a playable question rather
    -- than 500.
    if not found then
      select q.* into v_q
      from questions q
      join question_packs p on p.id = q.pack_id
      where q.is_active
        and p.is_published
        and not p.is_locked
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
`;

  return `${header}\n${locked.map(questionInserts).join('\n\n')}\n\n${rpcs}`;
}

const decks = loadDecks();
const freeSql = buildFreeSql(decks);
const lockedSql = buildLockedSql(decks);

if (process.argv.includes('--check')) {
  let stale = false;
  for (const [file, sql] of [
    [OUT_FREE, freeSql],
    [OUT_LOCKED, lockedSql],
  ]) {
    let current = '';
    try {
      current = readFileSync(file, 'utf8');
    } catch {
      current = '';
    }
    if (current !== sql) {
      console.error(`STALE: ${file} is out of date.`);
      stale = true;
    }
  }
  if (stale) {
    console.error('Run: node scripts/build-deck-seed.mjs');
    process.exit(1);
  }
  console.log('up to date');
} else {
  writeFileSync(OUT_FREE, freeSql, 'utf8');
  writeFileSync(OUT_LOCKED, lockedSql, 'utf8');
  const free = decks.filter((d) => !d.is_locked);
  const locked = decks.filter((d) => d.is_locked);
  console.log(`wrote ${OUT_FREE} (${free.length} decks)`);
  console.log(`wrote ${OUT_LOCKED} (${locked.length} decks)`);
  console.log(`${decks.length} decks, ${decks.reduce((n, d) => n + d.questions.length, 0)} questions`);
}
