-- Chale — locked / coming-soon packs, generated from content/decks/*.json.
--
-- DO NOT EDIT BY HAND. Edit the JSON, then run: node scripts/build-deck-seed.mjs
--
-- Locked packs are visible in the catalogue but cannot be drawn. is_locked is a
-- separate flag from is_published on purpose: an unpublished deck is hidden,
-- while a locked deck is a promise the storefront is allowed to show.
--
-- 4 locked decks, 175 questions:
--    50  late-night  (partner)
--    45  long-distance  (partner)
--    40  spicy-debates  (friend)
--    40  abusua  (family)

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
  for d in select id, slug from question_packs where slug in ('late-night', 'long-distance', 'spicy-debates', 'abusua') loop
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

insert into question_packs
  (slug, title, tagline, relationship_type, icon, tone, art_key, session_length, sort_order, is_published, is_locked)
values
  ('late-night', 'Late Night', 'For when the lights are off.', 'partner'::relationship_type, 'moon', 'late', 'stacked', 20, 7, true, true),
  ('long-distance', 'Long Distance', 'Miles apart, still close.', 'partner'::relationship_type, 'plane', 'distance', 'deck-edge', 20, 8, true, true),
  ('spicy-debates', 'Spicy Debates', 'Hot takes, zero fights.', 'friend'::relationship_type, 'flame', 'spicy', 'scattered', 20, 9, true, true),
  ('abusua', 'Abusua', 'Blood, chosen, and everything in between.', 'family'::relationship_type, 'house', 'abusua', 'deck-edge', 20, 10, true, true)
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
    is_locked = excluded.is_locked;

-- Late Night — 50 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'What is the last thing you think about before you fall asleep next to me?', 'text'),
  (2, 'Which late-night conversation of ours do you still replay?', 'either'),
  (3, 'What do you wish I asked you when the lights are off?', 'text'),
  (4, 'When the power goes out, what do you want us to do with the dark?', 'either'),
  (5, 'What is a small thing I do at night that makes you feel safe?', 'voice'),
  (6, 'What is the most honest thing you have almost said to me at 2 a.m.?', 'text'),
  (7, 'If we shared a plate of kelewele right now, what would we talk about?', 'either'),
  (8, 'What is a fear that only shows up after midnight?', 'text'),
  (9, 'What song should be playing in the background of our quietest night?', 'either'),
  (10, 'What do you want more of from me when the day is finally over?', 'voice'),
  (11, 'What is a memory of us that feels warmer at night?', 'either'),
  (12, 'What is something you notice about me when I am half asleep?', 'text'),
  (13, 'If we could take a night walk anywhere in Accra, where would we go?', 'either'),
  (14, 'What is a dream you have never told me because it felt too big?', 'text'),
  (15, 'What is the best thing about being awake while the city is quiet?', 'either'),
  (16, 'What do you need from me on a night when you cannot switch off?', 'voice'),
  (17, 'What is a line from a film or song that describes how you feel about us?', 'text'),
  (18, 'What is one thing you would change about how we say goodnight?', 'either'),
  (19, 'What is a late-night habit of yours you are not proud of?', 'text'),
  (20, 'When you cannot sleep, what do you usually wish someone would say?', 'voice'),
  (21, 'What is the most comforting sound in our home at night?', 'either'),
  (22, 'What is a question you have wanted to ask me but saved for the dark?', 'text'),
  (23, 'What does intimacy look like on an ordinary Tuesday night?', 'text'),
  (24, 'What is a small adventure we could have after 10 p.m.?', 'either'),
  (25, 'What is something you want to forgive yourself for before the morning?', 'text'),
  (26, 'What do you think I need on a night when I am too quiet?', 'voice'),
  (27, 'What is the sexiest thing about a slow, unhurried evening?', 'text'),
  (28, 'If our night had a soundtrack, what would the first song be?', 'either'),
  (29, 'What is a promise you want us to keep only at night?', 'text'),
  (30, 'What is a way I could make your evenings feel lighter?', 'voice'),
  (31, 'What is the last dream you remember?', 'either'),
  (32, 'What is something you want to whisper to me but have not?', 'text'),
  (33, 'What is a place in Ghana that feels like a late-night secret?', 'either'),
  (34, 'What is the difference between being alone at night and being lonely?', 'text'),
  (35, 'What is a touch that says more than a whole conversation?', 'either'),
  (36, 'What do you want to wake up to more often?', 'voice'),
  (37, 'What is a worry that gets louder when the house is silent?', 'text'),
  (38, 'What is the most romantic thing about an unplanned night in?', 'either'),
  (39, 'What is a question about us you are afraid to hear the answer to?', 'text'),
  (40, 'What is one thing we should do before the year ends, just the two of us?', 'either'),
  (41, 'What is a way we can make bedtime feel less like a routine?', 'voice'),
  (42, 'What is something you have learned about me from sharing a bed?', 'text'),
  (43, 'What is the best late-night meal we have ever had together?', 'either'),
  (44, 'What is a compliment you want to hear when no one else is around?', 'text'),
  (45, 'What is a memory of your childhood that comes back at night?', 'text'),
  (46, 'What is a small ritual you would like us to start after dark?', 'either'),
  (47, 'What is something you want me to know before you fall asleep?', 'voice'),
  (48, 'What is a way we can turn a sleepless night into something good?', 'either'),
  (49, 'What is the last thing you want to hear from me tonight?', 'text'),
  (50, 'If we could pause one night and live in it forever, which one would it be?', 'either')
) as v(ordinal, text, kind)
where p.slug = 'late-night';

-- Long Distance — 45 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'What is the first thing you want to do when we are finally in the same room?', 'either'),
  (2, 'Which time zone difference has been the hardest for us?', 'text'),
  (3, 'What is a small part of your day you wish I could see?', 'either'),
  (4, 'What do you miss most about my presence, not my messages?', 'voice'),
  (5, 'What is a Ghanaian food you wish you could send me through the phone?', 'either'),
  (6, 'What is the best voice note you have ever sent me?', 'text'),
  (7, 'How do you know when I am missing you before I say it?', 'text'),
  (8, 'What is a place in Accra you want to show me when you are back?', 'either'),
  (9, 'What is the hardest part of saying goodbye at the airport?', 'text'),
  (10, 'What is a ritual we should keep even when we are in different cities?', 'either'),
  (11, 'What is something you have learned to do alone that you would rather do with me?', 'voice'),
  (12, 'What is a song that makes the distance feel smaller?', 'either'),
  (13, 'What is a small surprise that would make a long-distance week better?', 'text'),
  (14, 'What do you want me to do on a day when the distance feels too heavy?', 'voice'),
  (15, 'What is a memory of us that gets you through a lonely evening?', 'text'),
  (16, 'If we could meet halfway, where would that be?', 'either'),
  (17, 'What is a habit from home you have held on to abroad?', 'text'),
  (18, 'What is something about long distance you are grateful for?', 'either'),
  (19, 'What is a message you have typed and deleted?', 'text'),
  (20, 'What is the first meal we should share when we reunite?', 'either'),
  (21, 'What is a way we can make the same movie night work across two countries?', 'text'),
  (22, 'What is something you want me to know about your life there that I cannot see?', 'voice'),
  (23, 'What is a fear you have about distance that you rarely say out loud?', 'text'),
  (24, 'What is the most romantic thing about waiting for someone?', 'either'),
  (25, 'What is a tradition from your hometown you want us to keep?', 'text'),
  (26, 'What is a time you felt close to me even though we were far apart?', 'either'),
  (27, 'What is a small thing I can do to make your morning better from here?', 'voice'),
  (28, 'What is the hardest hour of your day without me?', 'text'),
  (29, 'What is a place you dream of visiting together that is neither here nor there?', 'either'),
  (30, 'What is something you want to say to me at the airport that you never do?', 'text'),
  (31, 'How has distance changed the way you love?', 'text'),
  (32, 'What is a gift that would feel like a piece of home?', 'either'),
  (33, 'What is a boundary we need to protect our time zones?', 'text'),
  (34, 'What is a memory of a call that we almost missed?', 'voice'),
  (35, 'What is a way we can celebrate small wins from far away?', 'either'),
  (36, 'What is something you have gotten better at because of us being apart?', 'text'),
  (37, 'What is a question you want to ask me about my life here?', 'either'),
  (38, 'What is the first thing you notice when you hear my voice after a long day?', 'text'),
  (39, 'What is a plan we can make for the next time we are together?', 'either'),
  (40, 'What is something you want us to stop apologising for?', 'text'),
  (41, 'What is a way we can make the countdown feel exciting instead of painful?', 'voice'),
  (42, 'What is a place in your city that feels like ours?', 'text'),
  (43, 'What is the best thing about the moment we stop saying goodbye?', 'either'),
  (44, 'What is something you want to promise me about the distance?', 'text'),
  (45, 'If distance had a voice, what would you tell it?', 'voice')
) as v(ordinal, text, kind)
where p.slug = 'long-distance';

-- Spicy Debates — 40 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'Jollof or waakye — and be honest, not polite.', 'either'),
  (2, 'Which is the real national dish: banku and tilapia or fufu and light soup?', 'either'),
  (3, 'Pineapple on pizza: crime or genius?', 'text'),
  (4, 'Is it acceptable to eat kelewele on the way home and call it dinner?', 'either'),
  (5, 'What is the most overrated Ghanaian food?', 'text'),
  (6, 'Trotro etiquette: who gets the window seat when two strangers board?', 'either'),
  (7, 'Should you greet everyone in a trotro or mind your business?', 'text'),
  (8, 'Is highlife better than afrobeats? Defend your answer.', 'either'),
  (9, 'Black Stars or the Premier League — which disappointment hurts more?', 'text'),
  (10, 'Which Accra neighbourhood is the most overrated?', 'either'),
  (11, 'Is a hot dog a sandwich?', 'text'),
  (12, 'What is the correct way to eat fufu: swallow or chew?', 'either'),
  (13, 'Should pineapple be allowed in jollof? Yes or no.', 'text'),
  (14, 'What is the most annoying thing a friend can do at a party?', 'either'),
  (15, 'Is it ever okay to be late to a Ghanaian funeral?', 'text'),
  (16, 'Which is worse: a bad haircut or a bad outfit?', 'either'),
  (17, 'Is "I''ll be there in five minutes" a promise or a vibe?', 'text'),
  (18, 'What is the most controversial opinion you hold about music?', 'either'),
  (19, 'Should you split the bill or fight over it?', 'text'),
  (20, 'Is it rude to refuse food when you are full?', 'either'),
  (21, 'What is the best street food in Accra, and why is it kelewele?', 'text'),
  (22, 'Can a friendship survive a borrowed book never returned?', 'either'),
  (23, 'Which is the superior way to eat plantain: fried or boiled?', 'text'),
  (24, 'Is it acceptable to watch a series without your friend?', 'either'),
  (25, 'What is the worst gift a friend can give?', 'text'),
  (26, 'Should you tell a friend their partner is bad news?', 'either'),
  (27, 'Which is more important: being right or keeping the peace?', 'text'),
  (28, 'Is waakye a breakfast food, lunch food, or a way of life?', 'either'),
  (29, 'What is the most overrated trend right now?', 'text'),
  (30, 'Should friends post each other without permission?', 'either'),
  (31, 'What is the correct response to "we need to talk"?', 'text'),
  (32, 'Is it okay to ghost a friend you have outgrown?', 'either'),
  (33, 'Which is worse: a fake laugh or a fake apology?', 'text'),
  (34, 'What is a small thing that instantly makes you judge someone?', 'either'),
  (35, 'Is chale a word, a feeling, or a whole philosophy?', 'text'),
  (36, 'What is the best way to end a debate with a stubborn friend?', 'either'),
  (37, 'Should a group holiday have a strict itinerary?', 'text'),
  (38, 'What is the most Ghanaian thing you have ever done?', 'either'),
  (39, 'Is it possible to be friends with someone who does not like jollof?', 'text'),
  (40, 'What is a hill you are willing to die on?', 'voice')
) as v(ordinal, text, kind)
where p.slug = 'spicy-debates';

-- Abusua — 40 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'What is a family tradition you want to pass on?', 'text'),
  (2, 'Who in the family tells the best stories?', 'either'),
  (3, 'What is a lesson an elder taught you that you still use?', 'text'),
  (4, 'What does home mean to you beyond a building?', 'voice'),
  (5, 'Which family meal do you associate with being loved?', 'either'),
  (6, 'What is a Ghanaian naming tradition you would like to keep?', 'text'),
  (7, 'What is something you wish our family talked about more openly?', 'text'),
  (8, 'Who in the family do you call when you need advice?', 'either'),
  (9, 'What is a family habit that outsiders find strange?', 'text'),
  (10, 'What is a memory of Sunday lunch that makes you smile?', 'either'),
  (11, 'What is a way we can honour the elders without repeating their mistakes?', 'text'),
  (12, 'What is a story from your hometown you want me to know?', 'voice'),
  (13, 'What is the hardest part of being part of a large family?', 'text'),
  (14, 'What is a family rule you are glad we broke?', 'either'),
  (15, 'What is a tradition you would like to start with the next generation?', 'text'),
  (16, 'What does respect look like in our family?', 'text'),
  (17, 'What is a family recipe you want to learn?', 'either'),
  (18, 'What is something you are proud of about where you come from?', 'voice'),
  (19, 'What is a family story that gets better every time it is told?', 'either'),
  (20, 'Who is the person in the family you wish you knew better?', 'text'),
  (21, 'What is a way you have changed since leaving home?', 'text'),
  (22, 'What is a family expectation you have decided to keep?', 'either'),
  (23, 'What is a family expectation you have decided to let go?', 'text'),
  (24, 'What is a small act of care that feels very Ghanaian to you?', 'either'),
  (25, 'What is a family secret that is really just a funny story now?', 'text'),
  (26, 'What is the best piece of advice you have received from a parent?', 'voice'),
  (27, 'What is a holiday or ceremony that brings everyone together?', 'either'),
  (28, 'What is something you want to ask your parents but have not?', 'text'),
  (29, 'What is a way we can make family gatherings less stressful?', 'text'),
  (30, 'What is a family trait you see in yourself?', 'either'),
  (31, 'What is a family trait you are trying to unlearn?', 'text'),
  (32, 'What does family include that blood does not?', 'voice'),
  (33, 'What is a place that feels like your family''s home?', 'either'),
  (34, 'What is a language or phrase you want to keep alive?', 'text'),
  (35, 'What is a family photo you would save first?', 'text'),
  (36, 'What is something you want to thank a family member for?', 'voice'),
  (37, 'What is a family argument that was actually about something else?', 'text'),
  (38, 'What is a way you want to be different from your parents?', 'text'),
  (39, 'What is a way you want to be exactly like them?', 'either'),
  (40, 'What is the legacy you want our family to carry?', 'text')
) as v(ordinal, text, kind)
where p.slug = 'abusua';

-- ============ Read side ============
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
