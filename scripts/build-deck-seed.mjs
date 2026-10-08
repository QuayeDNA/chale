// Generates supabase/migrations/0008_seed_decks.sql from content/decks/*.json.
//
// The JSON files are the authoring surface — a deck (copy, tone, icon, art key,
// and its questions) lives in exactly one file and never needs a migration.
// Run after editing any deck, then commit the regenerated SQL alongside it:
//
//   node scripts/build-deck-seed.mjs            # write the migration
//   node scripts/build-deck-seed.mjs --check    # fail if it is stale
//
// Zero dependencies on purpose: this is a build-time text transform, so it must
// not be able to break because of a dependency tree.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DECKS_DIR = join(here, '..', 'content', 'decks');
const OUT_FILE = join(here, '..', 'supabase', 'migrations', '0008_seed_decks.sql');

const VALID_KINDS = new Set(['text', 'voice', 'either']);
const VALID_RELATIONSHIPS = new Set(['partner', 'family', 'friend']);

// Single quotes are the only escape Postgres needs inside a normal string.
const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;

function loadDecks() {
  const files = readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json'));
  const decks = files.map((f) => ({ file: f, ...JSON.parse(readFileSync(join(DECKS_DIR, f), 'utf8')) }));

  const seenSlugs = new Set();
  for (const deck of decks) {
    const where = deck.file;
    for (const field of ['slug', 'title', 'tagline', 'relationship_type', 'icon', 'tone', 'art_key', 'sort_order']) {
      if (deck[field] === undefined) throw new Error(`${where}: missing "${field}"`);
    }
    if (!VALID_RELATIONSHIPS.has(deck.relationship_type)) {
      throw new Error(`${where}: relationship_type must be one of ${[...VALID_RELATIONSHIPS].join(', ')}`);
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
      if (typeof q.text !== 'string' || !q.text.trim()) throw new Error(`${where}: question ${i + 1} has no text`);
      if (!VALID_KINDS.has(q.kind)) throw new Error(`${where}: question ${i + 1} kind "${q.kind}" is not text|voice|either`);
      const key = q.text.toLowerCase().replace(/[^a-z ]/g, '');
      if (seenText.has(key)) throw new Error(`${where}: duplicate question text — ${q.text}`);
      seenText.add(key);
    });
  }
  return decks.sort((a, b) => a.sort_order - b.sort_order);
}

function buildSql(decks) {
  const totalQuestions = decks.reduce((n, d) => n + d.questions.length, 0);

  const header = `-- Chale — six themed decks, generated from content/decks/*.json.
--
-- DO NOT EDIT BY HAND. Edit the JSON, then run: node scripts/build-deck-seed.mjs
--
-- The flat 100-question 'Partner Pack' from 0002 is SOFT-retired above rather
-- than deleted: prompts.question_id has no ON DELETE action, so deleting it
-- would fail on any database that has already served a prompt. Retiring keeps
-- historical prompts intact and reversible (flip is_published / is_active back).
--
-- ${decks.length} decks, ${totalQuestions} questions:
${decks.map((d) => `--   ${String(d.questions.length).padStart(3)}  ${d.slug}  (${d.relationship_type})`).join('\n')}
--
-- Board §07 counts: Love & Relationships 100, Deep Talks 80, Fun & Silly 60,
-- Life & Dreams 75, Family 65, Friends 80.

-- ============ Soft-retire the legacy flat pack ============

update question_packs
set slug = 'legacy-partner-pack',
    is_published = false,
    tagline = 'Retired flat 100-question pack. Replaced by the six themed decks.'
where slug is null;

update questions q
set is_active = false
from question_packs p
where p.slug = 'legacy-partner-pack'
  and q.pack_id = p.id;

-- ============ Clear any previous run of these decks ============
-- Runs BEFORE the inserts so a re-run replaces content instead of duplicating
-- it. Question rows are only cleared when nothing references them: prompts keep
-- historical answers alive, and favourites would cascade-delete. A deck that
-- has been played is left alone, so a re-run is safe but not destructive.

do $$
declare
  d record;
begin
  for d in select id, slug from question_packs where slug is not null and slug <> 'legacy-partner-pack' loop
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

-- ============ Decks ============
-- Upsert on the partial unique slug index so a re-run refreshes deck metadata
-- rather than failing on the unique violation.

insert into question_packs
  (slug, title, tagline, relationship_type, icon, tone, art_key, session_length, sort_order, is_published)
values
${decks
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

  const questionInserts = decks
    .map((d) => {
      const rows = d.questions
        .map((q, i) => `  (${i + 1}, ${lit(q.text)}, ${lit(q.kind)})`)
        .join(',\n');
      return `-- ${d.title} — ${d.questions.length} questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
${rows}
) as v(ordinal, text, kind)
where p.slug = ${lit(d.slug)};`;
    })
    .join('\n\n');

  return `${header}${questionInserts}`;
}

const decks = loadDecks();
const sql = buildSql(decks);

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(OUT_FILE, 'utf8');
  } catch {
    current = '';
  }
  if (current !== sql) {
    console.error('STALE: supabase/migrations/0008_seed_decks.sql is out of date.');
    console.error('Run: node scripts/build-deck-seed.mjs');
    process.exit(1);
  }
  console.log('up to date');
} else {
  writeFileSync(OUT_FILE, sql, 'utf8');
  const total = decks.reduce((n, d) => n + d.questions.length, 0);
  console.log(`wrote ${OUT_FILE}`);
  console.log(`${decks.length} decks, ${total} questions`);
}
