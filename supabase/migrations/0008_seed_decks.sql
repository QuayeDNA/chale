-- Chale — the free themed decks, generated from content/decks/*.json.
--
-- DO NOT EDIT BY HAND. Edit the JSON, then run: node scripts/build-deck-seed.mjs
--
-- The flat 100-question 'Partner Pack' from 0002 is SOFT-retired above rather
-- than deleted: prompts.question_id has no ON DELETE action, so deleting it
-- would fail on any database that has already served a prompt. Retiring keeps
-- historical prompts intact and reversible (flip is_published / is_active back).
--
-- 6 free decks, 460 questions:
--   100  love-and-relationships  (partner)
--    80  deep-talks  (partner)
--    60  fun-and-silly  (partner)
--    75  life-and-dreams  (partner)
--    65  family-table  (family)
--    80  day-ones  (friend)
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

update question_packs
set slug = 'family-table',
    title = 'Family Table',
    tagline = 'The people who made you, and the ones you are making.'
where slug = 'family'
  and not exists (select 1 from question_packs where slug = 'family-table');

update question_packs
set slug = 'day-ones',
    title = 'Day Ones',
    tagline = 'The people who knew before anyone else.'
where slug = 'friends'
  and not exists (select 1 from question_packs where slug = 'day-ones');

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
  for d in select id, slug from question_packs where slug in ('love-and-relationships', 'deep-talks', 'fun-and-silly', 'life-and-dreams', 'family-table', 'day-ones') loop
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
  ('love-and-relationships', 'Love & Relationships', 'Closer, honestly.', 'partner'::relationship_type, 'heart', 'love', 'stacked', 20, 1, true),
  ('deep-talks', 'Deep Talks', 'The stuff that actually matters.', 'partner'::relationship_type, 'message', 'deep', 'deck-edge', 20, 2, true),
  ('fun-and-silly', 'Fun & Silly', 'No deep answers required.', 'partner'::relationship_type, 'sun', 'silly', 'scattered', 20, 3, true),
  ('life-and-dreams', 'Life & Dreams', 'Where do you want to go from here?', 'partner'::relationship_type, 'sparkles', 'dreams', 'stacked', 20, 4, true),
  ('family-table', 'Family Table', 'The people who made you, and the ones you are making.', 'family'::relationship_type, 'house', 'family', 'deck-edge', 20, 5, true),
  ('day-ones', 'Day Ones', 'The people who knew before anyone else.', 'friend'::relationship_type, 'people', 'friends', 'scattered', 20, 6, true)
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

-- Love & Relationships — 100 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'What was the moment you knew I was special to you?', 'either'),
  (2, 'What do you need more of from me?', 'text'),
  (3, 'Whats a boundary you wish I understood better?', 'text'),
  (4, 'When do you feel safest with me?', 'either'),
  (5, 'What do you feel you dont get to express enough?', 'voice'),
  (6, 'Whats a fear you have about us, stated gently?', 'text'),
  (7, 'What made you choose me?', 'either'),
  (8, 'What part of your past are you most proud to have survived?', 'either'),
  (9, 'When was the last time you cried, and why?', 'either'),
  (10, 'Whats something you worry about that you dont usually say out loud?', 'text'),
  (11, 'Whats been on your mind lately that you havent told me yet?', 'voice'),
  (12, 'What question do you wish I would ask you?', 'voice'),
  (13, 'Whats a moment you felt truly understood by me?', 'either'),
  (14, 'Whats something youve been carrying that isnt mine to carry?', 'either'),
  (15, 'What do you appreciate about me that you dont say enough?', 'either'),
  (16, 'Whats something I do that makes you feel loved?', 'text'),
  (17, 'Whats something I did lately that you are proud of?', 'text'),
  (18, 'Whats your favourite thing about how we communicate?', 'text'),
  (19, 'Tell me a memory from our early days that you replay often.', 'voice'),
  (20, 'Whats the first thing you noticed about me?', 'either'),
  (21, 'What memory of us makes you smile on a bad day?', 'voice'),
  (22, 'What do you remember about the day we met?', 'voice'),
  (23, 'Whats a trip or outing we did that youd relive?', 'voice'),
  (24, 'Whats a habit of mine youve grown to love?', 'text'),
  (25, 'Is there a song that reminds you of us? What moment does it take you back to?', 'either'),
  (26, 'Whats something I did that made you laugh so hard it hurt?', 'voice'),
  (27, 'What memory of me do you have that I probably dont remember?', 'voice'),
  (28, 'What one you said to me did you mean more than I realised?', 'either'),
  (29, 'Whats been your favourite Chale moment with me?', 'voice'),
  (30, 'Whats a small thing you do that you hope I have noticed?', 'either'),
  (31, 'Whats a promise you want to make to us going forward?', 'voice'),
  (32, 'What tradition should we start together?', 'either'),
  (33, 'Whats a first you are excited for us to have?', 'either'),
  (34, 'What makes you feel closest to me?', 'either'),
  (35, 'What small thing do you want us to do more of together?', 'text'),
  (36, 'Whats a change we made recently that is working well?', 'text'),
  (37, 'Whats one thing about our relationship youd never want to lose?', 'either'),
  (38, 'If you could give future-us one piece of advice, what would it be?', 'voice'),
  (39, 'Whats one thing you hope we are still doing together in ten years?', 'either'),
  (40, 'Whats something ordinary youd love to make special with me?', 'either'),
  (41, 'What would you want me to remember about you in twenty years?', 'either'),
  (42, 'Whats a season of your life youd revisit with me?', 'either'),
  (43, 'Whats something we disagree on that you are glad we do?', 'either'),
  (44, 'Whats something you changed your mind about because of me?', 'either'),
  (45, 'What is something you started liking because I like it?', 'either'),
  (46, 'Where did you go in your head the last time we argued?', 'either'),
  (47, 'What does feeling loved actually feel like to you, day to day?', 'either'),
  (48, 'Which of my habits would you keep if you could keep only one?', 'text'),
  (49, 'What do you forgive me for without ever saying it?', 'voice'),
  (50, 'When did you last feel truly understood by me, and what did I do?', 'voice'),
  (51, 'Whats something about me you are still getting to know?', 'voice'),
  (52, 'What do you want us to be better at doing together?', 'text'),
  (53, 'Describe our relationship in three words. Why those three?', 'voice'),
  (54, 'Whats the best thing I do when I dont know what to say?', 'text'),
  (55, 'Whats a piece of advice about us that youre giving yourself?', 'text'),
  (56, 'If our love had a smell, what would it smell like?', 'voice'),
  (57, 'What would you want our life to look like on an ordinary Wednesday?', 'either'),
  (58, 'Whats a habit youd like us to build in the next year?', 'text'),
  (59, 'What did you need when you were at your lowest, and did you get it?', 'either'),
  (60, 'Which version of me do you love most?', 'voice'),
  (61, 'Whats something about my family youve grown to really like?', 'text'),
  (62, 'What did we do better before life got busy?', 'either'),
  (63, 'What would you want written in our ten year anniversary note?', 'voice'),
  (64, 'Whats a place we went that felt like a different country?', 'voice'),
  (65, 'What is one thing about me you would not change if you could?', 'text'),
  (66, 'When we argue, what do you wish I would do first?', 'text'),
  (67, 'Whats a compliment about us that you have never told anyone?', 'voice'),
  (68, 'What am I better at than I give myself credit for?', 'text'),
  (69, 'Describe the moment you first felt at home with me.', 'voice'),
  (70, 'What do you want to feel with me that you havent felt yet?', 'voice'),
  (71, 'Whats a small ritual of ours that actually matters to you?', 'either'),
  (72, 'What is something we fought about that you are actually glad we fought about?', 'text'),
  (73, 'How do you want to be reminded that I love you on a hard day?', 'text'),
  (74, 'Whats a future we discussed that you still think about?', 'voice'),
  (75, 'What is the bravest thing you have done in this relationship?', 'voice'),
  (76, 'Whats a piece of us you never want to photograph because it stays private?', 'text'),
  (77, 'When did I surprise you most?', 'either'),
  (78, 'What would you like me to stop apologising for?', 'text'),
  (79, 'Whats the difference between being in love with me and loving me?', 'voice'),
  (80, 'What did we get wrong for a long time that we have now fixed?', 'either'),
  (81, 'Name one thing I do that you would miss if I stopped.', 'text'),
  (82, 'When you picture us at our best, what are we doing?', 'voice'),
  (83, 'Whats the most romantic thing anyone has ever done for you?', 'voice'),
  (84, 'What would you want our last conversation to be about?', 'voice'),
  (85, 'Whats a word you use for me that I have never heard you say?', 'voice'),
  (86, 'How has loving me changed you as a person?', 'voice'),
  (87, 'What do you need on a day when you have nothing left to give?', 'text'),
  (88, 'What would you do if you knew we had one year left?', 'either'),
  (89, 'What do you think I love about you that you are not sure of?', 'voice'),
  (90, 'What promise should I ask you to keep, and how would I know you kept it?', 'text'),
  (91, 'Whats a conversation we keep postponing?', 'text'),
  (92, 'What would make you feel less alone this week, specifically?', 'text'),
  (93, 'Describe the last time you felt completely content.', 'voice'),
  (94, 'What is something I would never guess about you from watching you?', 'voice'),
  (95, 'What would you want me to know about you that you have never had the words for?', 'voice'),
  (96, 'What does our best day together look like in the past tense?', 'voice'),
  (97, 'What is one thing we do that you would keep even if nobody else understood?', 'either'),
  (98, 'Who else in your life gets the version of you I get?', 'text'),
  (99, 'What would you want to hear from me right now, if I were sitting next to you?', 'voice'),
  (100, 'What promise are we keeping right now without ever having said it out loud?', 'text')
) as v(ordinal, text, kind)
where p.slug = 'love-and-relationships';

-- Deep Talks — 80 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'What question you would rather answer in writing than out loud?', 'text'),
  (2, 'Whats something you used to believe that you no longer do?', 'text'),
  (3, 'Whats the best advice you have ever received?', 'text'),
  (4, 'Whats something you want to be braver about?', 'text'),
  (5, 'Whats a habit you are trying to break or build right now?', 'text'),
  (6, 'Whats a small win you had recently?', 'text'),
  (7, 'What would a good day look like for you, hour by hour?', 'either'),
  (8, 'Whats something you want to try together that scares you a little?', 'either'),
  (9, 'Whats a tradition from your family youd want to bring into ours?', 'either'),
  (10, 'Whats a place that feels like home to you, and why?', 'either'),
  (11, 'Whats something youd defend me on without hesitation?', 'either'),
  (12, 'What''s a dream youve never actually said out loud?', 'voice'),
  (13, 'What would success look like for you in five years, honestly?', 'either'),
  (14, 'Whats a big goal you have that you keep to yourself?', 'text'),
  (15, 'What skill do you wish you had by this time next year?', 'text'),
  (16, 'What hobby have you always wanted to start but havent?', 'text'),
  (17, 'If you had a whole free day with no obligations, how would you spend it?', 'voice'),
  (18, 'Whats one thing from your childhood youd want to relive for a day?', 'voice'),
  (19, 'If money werent a factor, what would you do next year?', 'text'),
  (20, 'What place would you love for us to visit together?', 'either'),
  (21, 'What would you rather be doing at thirty than at work?', 'voice'),
  (22, 'Describe the version of yourself from five years ago. What did they get right that you have forgotten?', 'voice'),
  (23, 'What is a fight you had with yourself that finally ended?', 'either'),
  (24, 'What do you believe that most people disagree with?', 'voice'),
  (25, 'Whats something you want to be known for, not just good at?', 'text'),
  (26, 'What is the difference between the life you have and the one you imagined?', 'voice'),
  (27, 'What have you had to forgive yourself for?', 'either'),
  (28, 'Who shaped you most, and what did they give you that you still use?', 'voice'),
  (29, 'Whats something you pretend to enjoy but actually do not?', 'text'),
  (30, 'When did you first realise you had grown up?', 'either'),
  (31, 'What would you want your thirties to feel like?', 'voice'),
  (32, 'Whats one thing you would do differently if you could go back five years?', 'either'),
  (33, 'What in your life right now feels like it is on loan?', 'text'),
  (34, 'What do you hope does not change about you?', 'text'),
  (35, 'When have you felt like an imposter, and did you believe it?', 'either'),
  (36, 'What is something you have grown out of that you still miss?', 'voice'),
  (37, 'What would you want to be remembered for among friends?', 'voice'),
  (38, 'Whats a hard truth you have known for a while and not said?', 'text'),
  (39, 'What keeps you up at night that you have never mentioned?', 'text'),
  (40, 'Describe a moment you felt completely alone, even around people.', 'voice'),
  (41, 'What would you do if you knew you had this one chance to start again?', 'voice'),
  (42, 'What is something you would like to stop explaining about yourself?', 'text'),
  (43, 'When did you last change your mind about something important?', 'either'),
  (44, 'What is a belief you are still testing?', 'text'),
  (45, 'Who would you call at 3am right now?', 'voice'),
  (46, 'What would you want your life to look like at sixty?', 'voice'),
  (47, 'What are you proudest of that nobody has congratulated you for?', 'text'),
  (48, 'What have you been avoiding that you already know the answer to?', 'text'),
  (49, 'Describe the last time you felt like a fraud.', 'voice'),
  (50, 'What do you want to spend more of your limited attention on?', 'text'),
  (51, 'What would you tell yourself one year ago?', 'either'),
  (52, 'What is a hard conversation you know needs to happen?', 'text'),
  (53, 'When was the last time you changed your mind about someone?', 'voice'),
  (54, 'What does a good life look like when nobody is watching?', 'voice'),
  (55, 'What are you carrying that you could hand to someone else?', 'text'),
  (56, 'What has been the best decision you ever made?', 'either'),
  (57, 'What is a mistake you are still paying for?', 'voice'),
  (58, 'If you could write one letter to your younger self, what would it say?', 'voice'),
  (59, 'What would you do differently if you knew you had made it?', 'voice'),
  (60, 'What is the most useful thing anyone ever said to you?', 'text'),
  (61, 'What do you want your work to have meant?', 'either'),
  (62, 'Where do you go when you need to feel safe?', 'either'),
  (63, 'What is something you would want to know at eighty?', 'voice'),
  (64, 'What have you stopped doing because of what people might think?', 'text'),
  (65, 'What is one thing you are better at than you give yourself credit for?', 'text'),
  (66, 'Describe the version of you that is five years away.', 'voice'),
  (67, 'What have you been waiting for permission to do?', 'text'),
  (68, 'What is a rule you live by that you would break for the right person?', 'either'),
  (69, 'What do you hope people remember about you, years from now?', 'voice'),
  (70, 'What is the thing you would regret not attempting?', 'either'),
  (71, 'What would you say you are better at than you give yourself credit for?', 'text'),
  (72, 'What have you never told anyone because it felt too small to matter?', 'text'),
  (73, 'What do you think is the hardest part of being you?', 'either'),
  (74, 'When did you last feel like you were exactly where you were supposed to be?', 'voice'),
  (75, 'What is a decision you would make differently knowing what you know now?', 'either'),
  (76, 'What do you think you would do if you had no one left to impress?', 'either'),
  (77, 'What is something you have never done and would not want to tell anyone about?', 'voice'),
  (78, 'What would you say is the most honest thing about your life right now?', 'text'),
  (79, 'What is a piece of advice you would give to someone ten years younger than you?', 'either'),
  (80, 'What do you think has been the most important thing you have ever learned?', 'voice')
) as v(ordinal, text, kind)
where p.slug = 'deep-talks';

-- Fun & Silly — 60 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'What was the best part of your day that I wasnt there for?', 'text'),
  (2, 'Whats one small thing youre looking forward to this week?', 'text'),
  (3, 'What did you eat today that you actually enjoyed?', 'text'),
  (4, 'What song have you had on repeat lately?', 'text'),
  (5, 'What are you working on right now that you secretly enjoy?', 'text'),
  (6, 'Who made you feel good today?', 'text'),
  (7, 'Describe your day in exactly three words.', 'voice'),
  (8, 'Whats something funny that happened today, even if it was tiny?', 'voice'),
  (9, 'If you could trade lives with me for one day, what would you want to try first?', 'voice'),
  (10, 'Whats your guilty-pleasure TV show?', 'text'),
  (11, 'Whats the weirdest food combo you secretly love?', 'text'),
  (12, 'Whats your current obsession, show, food, hobby, or otherwise?', 'text'),
  (13, 'Whats the most embarrassing thing I have ever said to a stranger?', 'voice'),
  (14, 'If our relationship were a movie, what genre would it be?', 'voice'),
  (15, 'Whats a ridiculous thing you would do for a million dollars?', 'voice'),
  (16, 'Whats an inside joke we need to start?', 'either'),
  (17, 'Whats a talent you have that I dont know about yet?', 'voice'),
  (18, 'If you had to describe me as a weather pattern, what would I be?', 'voice'),
  (19, 'Whats the most you thing you did this week?', 'either'),
  (20, 'Good evening, Chale: whats the one thing on your mind today?', 'voice'),
  (21, 'If I were next to you right now, what would you want to do?', 'voice'),
  (22, 'Say the first thing that comes to mind when you think of me.', 'voice'),
  (23, 'If our day had a soundtrack, which song is playing right now?', 'voice'),
  (24, 'Whats the last thing that genuinely made you laugh?', 'voice'),
  (25, 'Describe your mood right now in three seconds of atmosphere.', 'voice'),
  (26, 'If you could send me one sound from where you are right now, what would it be?', 'voice'),
  (27, 'What is your most irrational hill to die on?', 'text'),
  (28, 'Which of us would survive a zombie apocalypse and which would not?', 'either'),
  (29, 'What is your most useless talent?', 'voice'),
  (30, 'If your life had a theme song, would you actually like it?', 'voice'),
  (31, 'What is the pettiest hill you have ever climbed?', 'voice'),
  (32, 'What is something you do badly on purpose?', 'text'),
  (33, 'If we ran a terrible restaurant together, what would we serve?', 'voice'),
  (34, 'What would be on your tombstone?', 'either'),
  (35, 'Which of us would you rather be stuck in an airport with for six hours?', 'voice'),
  (36, 'What is a tiny victory you had today that nobody would understand?', 'text'),
  (37, 'What is the worst haircut you have ever had?', 'voice'),
  (38, 'If you had to communicate using only emojis for a day, what would you use?', 'either'),
  (39, 'What is the most ridiculous thing you believed as a child?', 'voice'),
  (40, 'What is the worst gift you have ever received?', 'voice'),
  (41, 'What is the best nickname you have ever had?', 'text'),
  (42, 'If we were to start a terrible podcast, what would it be about?', 'voice'),
  (43, 'What is a smell that instantly takes you back to being a kid?', 'voice'),
  (44, 'What is the most dramatic thing you have done over something small?', 'voice'),
  (45, 'What would you name a pet we do not have?', 'either'),
  (46, 'What is your most chaotic cooking idea?', 'text'),
  (47, 'If you were a spice, which one would you be?', 'voice'),
  (48, 'What is the pettiest thing you have ever done on purpose?', 'voice'),
  (49, 'What is something you would absolutely refuse to do, no matter the money?', 'either'),
  (50, 'What is the most awkward thing you have ever done in public?', 'voice'),
  (51, 'If you had to describe your week as a movie trailer, what is the tagline?', 'voice'),
  (52, 'What is a trend you were fully committed to that you now pretend never happened?', 'text'),
  (53, 'What is the most dramatic reaction you have had to something small?', 'voice'),
  (54, 'What is something you are unreasonably good at?', 'text'),
  (55, 'What would your villain origin story be?', 'voice'),
  (56, 'What is the worst possible name for a child, in your opinion?', 'either'),
  (57, 'What is something you find genuinely funny that most people do not?', 'text'),
  (58, 'What is the most ridiculous thing you have ever done for a laugh?', 'voice'),
  (59, 'If you were a terrible superhero name, what would it be?', 'either'),
  (60, 'What is a prank you would pull if you knew you would get away with it?', 'voice')
) as v(ordinal, text, kind)
where p.slug = 'fun-and-silly';

-- Life & Dreams — 75 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'If you could teleport anywhere for dinner tomorrow, where are we eating?', 'voice'),
  (2, 'What would you like your days to look like a year from now?', 'either'),
  (3, 'What is one thing you want to be able to do that you cannot do yet?', 'text'),
  (4, 'What do you want your work to look like in two years?', 'either'),
  (5, 'Where would you like to live, and what makes it the right place?', 'either'),
  (6, 'What is a plan you have quietly been making for a while?', 'text'),
  (7, 'What would you want to build, make, or grow if nobody was watching?', 'text'),
  (8, 'What would you like to be doing at fifty?', 'voice'),
  (9, 'What is the first thing on your list that you have never started?', 'text'),
  (10, 'What would your ideal week look like, hour by hour?', 'either'),
  (11, 'What would you like to be famous for, for one week?', 'voice'),
  (12, 'What is something you would like to be really good at before you are thirty?', 'text'),
  (13, 'If you could take a year off and it changed nothing, what would you do?', 'either'),
  (14, 'What have you always wanted to try and never got round to?', 'text'),
  (15, 'What do you want to stop doing with your time?', 'text'),
  (16, 'Where do you see us in five years?', 'either'),
  (17, 'What would you like to be remembered for, at work?', 'text'),
  (18, 'What is a goal you have given up on that you secretly still want?', 'text'),
  (19, 'What would your perfect Sunday look like?', 'either'),
  (20, 'What is something you want to learn just because it would be fun?', 'text'),
  (21, 'Where would you want to be living a year from now?', 'either'),
  (22, 'What would you like to do with more free time?', 'text'),
  (23, 'What is one thing you want to stop apologising for?', 'text'),
  (24, 'What would you like to build together, long term?', 'either'),
  (25, 'What is a place you would like to see before anything else?', 'text'),
  (26, 'Describe the future you are quietly hoping for.', 'voice'),
  (27, 'What would you want your mornings to look like?', 'either'),
  (28, 'What is something you have always wanted to prove?', 'text'),
  (29, 'What would you do with an extra thousand a month?', 'text'),
  (30, 'What is the best decision you think you have not made yet?', 'either'),
  (31, 'What would you like to be doing instead of working, ideally?', 'text'),
  (32, 'Where do you see yourself in ten years?', 'either'),
  (33, 'What would you like to have figured out by then?', 'text'),
  (34, 'What is a place you feel completely at home in?', 'either'),
  (35, 'What would you want to have written, painted, or made?', 'text'),
  (36, 'What is something you want to do before you are too old?', 'either'),
  (37, 'What would you like your life to feel like at the end of a long day?', 'either'),
  (38, 'What is a dream you have never told anyone about?', 'text'),
  (39, 'Where would you like your weekends to go?', 'text'),
  (40, 'What do you want to do more of, and less of?', 'either'),
  (41, 'What would you like to be able to afford one day?', 'text'),
  (42, 'What is a small change you want to make this year?', 'text'),
  (43, 'What do you want your thirties to have that yours did not?', 'either'),
  (44, 'Describe a day in the life you are aiming for.', 'voice'),
  (45, 'What would you like to be doing this time next year?', 'either'),
  (46, 'What is a goal you would set if you knew you could not fail?', 'text'),
  (47, 'What is something you want to be better at this year, and why now?', 'text'),
  (48, 'Where would you like to be in five years, honestly?', 'either'),
  (49, 'What would you like to have accomplished by the end of this year?', 'text'),
  (50, 'What is something you would like to be known for in your community?', 'either'),
  (51, 'What would your ideal week look like if you were still in school?', 'either'),
  (52, 'What is a place you would like to go with your family?', 'text'),
  (53, 'What do you want your relationship with work to look like?', 'either'),
  (54, 'What is one thing you would like to achieve before you retire?', 'text'),
  (55, 'What would you like to be doing that you have never told anyone about?', 'text'),
  (56, 'What is one thing you want to start this year, no matter how small?', 'text'),
  (57, 'What would you like your life to look like in a decade?', 'either'),
  (58, 'What is a place you would like to live, even just for a while?', 'either'),
  (59, 'What would you like to be doing with your weekends next year?', 'text'),
  (60, 'Describe a goal you have that you have never told anyone about.', 'voice'),
  (61, 'What would you like to have finished by the end of this year?', 'text'),
  (62, 'What would you like to have started?', 'text'),
  (63, 'What is something you would like to do while you still have the energy for it?', 'either'),
  (64, 'Where would you like to be in a year, in as much detail as you can?', 'either'),
  (65, 'What would your life look like if you stopped worrying about what people thought?', 'either'),
  (66, 'What is something you would like to make, build, or write?', 'text'),
  (67, 'What would you like to do differently about how you spend your days?', 'text'),
  (68, 'What is something you want to be known for, in a place where nobody knows you yet?', 'either'),
  (69, 'What would you like your evenings to look like from now on?', 'either'),
  (70, 'What is something you have always wanted and still want, without shame?', 'voice'),
  (71, 'What would you like to do with your next birthday?', 'text'),
  (72, 'What is a place you would like to see, and who would you want to see it with?', 'either'),
  (73, 'What would you like your work to look like when you are tired of it?', 'either'),
  (74, 'What is something you would like to say yes to this year?', 'text'),
  (75, 'What would you like to stop being afraid of?', 'either')
) as v(ordinal, text, kind)
where p.slug = 'life-and-dreams';

-- Family Table — 65 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'What is a tradition from your childhood that you still carry today?', 'voice'),
  (2, 'Who in your family made you feel the safest when you were small?', 'either'),
  (3, 'What did your parents do that you want to do for your own kids?', 'either'),
  (4, 'What is a phrase your family says that you have ended up using?', 'text'),
  (5, 'Who in your family are you closest to right now?', 'text'),
  (6, 'What is the best meal you remember from being a child?', 'voice'),
  (7, 'What did you want to be when you were ten?', 'voice'),
  (8, 'Who in your family shaped you most, and what did they give you that you still use?', 'voice'),
  (9, 'What is something your family is known for?', 'either'),
  (10, 'What is a disagreement in your family that you have never resolved?', 'text'),
  (11, 'Describe your home as a child in three words.', 'voice'),
  (12, 'What is something you wish you had asked your parents while they were still here?', 'voice'),
  (13, 'What is the thing you always do on your birthday?', 'text'),
  (14, 'Who in your family tells the truth the most?', 'either'),
  (15, 'What is a family joke you would explain to an outsider?', 'text'),
  (16, 'What do you want your family to know about you?', 'either'),
  (17, 'What is the most ridiculous thing your family has ever done?', 'voice'),
  (18, 'How has your family changed over the last ten years?', 'either'),
  (19, 'Who do you call first when something good happens?', 'text'),
  (20, 'What is something your family taught you that you did not want to learn?', 'either'),
  (21, 'What is a story about you that your family tells differently every time?', 'voice'),
  (22, 'What would you like to do with your family this year?', 'either'),
  (23, 'What is the best advice a parent ever gave you?', 'text'),
  (24, 'Who in your family do you feel closest to, and why?', 'either'),
  (25, 'What is a word or phrase your family uses that means something only you understand?', 'text'),
  (26, 'Describe a family holiday you still think about.', 'voice'),
  (27, 'What is something about your family you are proud of?', 'text'),
  (28, 'What would you like to pass down to the next generation?', 'either'),
  (29, 'Who in your family makes you laugh the most?', 'text'),
  (30, 'What is the hardest thing your family has been through together?', 'either'),
  (31, 'What do you and your siblings disagree about most?', 'either'),
  (32, 'What would you like to be remembered for by your family?', 'text'),
  (33, 'What is the longest you have lived away from home?', 'either'),
  (34, 'What did you miss most about home?', 'voice'),
  (35, 'What is something you and your family do that no one else does?', 'either'),
  (36, 'Who in your family are you most proud of, and why?', 'either'),
  (37, 'What would you like your family to know about how you are doing?', 'text'),
  (38, 'What is a gift you will always remember?', 'either'),
  (39, 'Who has been the biggest influence on your life?', 'voice'),
  (40, 'What is a hard lesson your family taught you the long way?', 'text'),
  (41, 'Who in your family do you feel you have let down?', 'text'),
  (42, 'What is something your family does that you want to keep going?', 'either'),
  (43, 'Describe a moment when your family surprised you.', 'voice'),
  (44, 'What is the most you have ever disagreed with a parent?', 'either'),
  (45, 'What would you like your family to do more of?', 'text'),
  (46, 'What is something about your childhood you would not change?', 'either'),
  (47, 'What is something about your childhood you would change if you could?', 'either'),
  (48, 'Who is your closest family friend, almost family?', 'text'),
  (49, 'What is one thing you want to do before it is too late?', 'either'),
  (50, 'What do you hope your family never finds out about?', 'voice'),
  (51, 'What is something you would do differently as a parent?', 'text'),
  (52, 'Describe the person in your family you most want to be like.', 'voice'),
  (53, 'What is a family rule you have broken more than once?', 'text'),
  (54, 'Who in your family do you feel closest to right now, and what would you say to them?', 'voice'),
  (55, 'What is something your family made you, and what did you do with it?', 'either'),
  (56, 'What would you like your family to do together in the next year?', 'either'),
  (57, 'What is something about your family that makes you feel lucky?', 'text'),
  (58, 'Who taught you how to be kind?', 'voice'),
  (59, 'What is a phrase your parents said that you still hear in your own head?', 'either'),
  (60, 'What is something you would like to do again with your family?', 'text'),
  (61, 'When did you last feel like a kid?', 'either'),
  (62, 'What is your earliest memory, as clearly as you can get it?', 'voice'),
  (63, 'What is something about your family you would not change for anything?', 'text'),
  (64, 'Who in your family would you call first if something good happened?', 'text'),
  (65, 'What would you like your family to know about how much they matter to you?', 'voice')
) as v(ordinal, text, kind)
where p.slug = 'family-table';

-- Day Ones — 80 questions
insert into questions (pack_id, text, kind, ordinal, is_active)
select p.id, v.text, v.kind::question_kind, v.ordinal, true
from question_packs p
cross join (values
  (1, 'When did you first know we were going to be friends?', 'either'),
  (2, 'What is a habit of mine you would miss if we stopped talking?', 'text'),
  (3, 'What do you think I would do in a situation you have never seen me in?', 'either'),
  (4, 'What is something you would tell me that you would not tell anyone else?', 'text'),
  (5, 'What is the thing we were best at doing together?', 'either'),
  (6, 'When did you last feel like talking to me, and did you?', 'text'),
  (7, 'What do you think is my worst habit?', 'either'),
  (8, 'What is something you would like me to do more of?', 'text'),
  (9, 'Who else knows me as well as you do?', 'text'),
  (10, 'What would you say has changed in me, and when?', 'either'),
  (11, 'Describe your perfect day off with me, in detail.', 'voice'),
  (12, 'What is something I do that you find genuinely funny?', 'text'),
  (13, 'What is a piece of advice you wish someone had given you at my age?', 'text'),
  (14, 'What is something you would like to do again, like we used to?', 'either'),
  (15, 'What is a moment you felt really proud to be friends with me?', 'either'),
  (16, 'What is your favourite thing about being friends with me?', 'either'),
  (17, 'What would you do if I asked you to help me move at short notice?', 'text'),
  (18, 'What is the worst advice I have ever given you?', 'either'),
  (19, 'What is something you wish I would stop doing?', 'text'),
  (20, 'When did you last feel truly supported by me?', 'voice'),
  (21, 'What is something about being friends with me that you did not expect?', 'voice'),
  (22, 'What would you say has been the best year of your life so far?', 'either'),
  (23, 'What is something in your life right now that you wish more people knew about?', 'text'),
  (24, 'What would you want me to know about you that I might have missed?', 'either'),
  (25, 'What is a small thing that would make this week better?', 'text'),
  (26, 'Describe a moment you felt left out, and by whom.', 'voice'),
  (27, 'What would you want me to know that you have never told me?', 'voice'),
  (28, 'What do you think I am avoiding?', 'either'),
  (29, 'What would make today feel like a good day?', 'text'),
  (30, 'What is something you would like us to do before the year is out?', 'either'),
  (31, 'Describe the version of you that I would not recognise today.', 'voice'),
  (32, 'What is a subject you could talk about for hours with anyone?', 'text'),
  (33, 'What is the most fun thing you have done in the last year?', 'either'),
  (34, 'What would you want your friendship with me to look like at fifty?', 'either'),
  (35, 'What is something I said to you that stuck with you?', 'either'),
  (36, 'What is a small thing I do that makes your day better?', 'text'),
  (37, 'What is something you are proud of that you have not told me?', 'text'),
  (38, 'When did you last feel really happy, and who was there?', 'voice'),
  (39, 'What would you want to be remembered for, as a friend?', 'either'),
  (40, 'What is something you have never told me, and do not want to?', 'either'),
  (41, 'What would make you feel less alone this week?', 'text'),
  (42, 'What is a question you have wanted to ask me for ages?', 'either'),
  (43, 'Describe a time you felt really let down by someone.', 'voice'),
  (44, 'What do you think friendship should give people?', 'text'),
  (45, 'What is a friendship you have lost touch with, and why?', 'text'),
  (46, 'What would you do if I told you I was struggling, and had not said anything?', 'either'),
  (47, 'What is the nicest thing someone has done for you recently?', 'text'),
  (48, 'What would you like us to do more of, just for fun?', 'either'),
  (49, 'What is something you would want to say out loud but have not?', 'voice'),
  (50, 'What is your favourite thing about who you are with me?', 'either'),
  (51, 'What would you like to do when we all have free time?', 'either'),
  (52, 'What is something that made you laugh so hard you cried?', 'either'),
  (53, 'What is a small thing you want to start this month?', 'text'),
  (54, 'What do you think is the best thing about me that I do not see?', 'voice'),
  (55, 'What is a place you would want to visit with me?', 'either'),
  (56, 'What would you want to say to me if I were listening right now?', 'voice'),
  (57, 'Describe a time you felt genuinely supported by someone.', 'voice'),
  (58, 'What is something you would like me to know about friendship?', 'text'),
  (59, 'What is a goal you have that you have not told anyone about?', 'text'),
  (60, 'What would you like us to have done more of, when we were younger?', 'either'),
  (61, 'What is one thing you would never forgive me for?', 'text'),
  (62, 'What would you want your friendship with me to look like in ten years?', 'either'),
  (63, 'What is something you are looking forward to?', 'text'),
  (64, 'What do you think is the most important thing about a friend?', 'text'),
  (65, 'What is something I would do for you that I would not do for anyone else?', 'either'),
  (66, 'What is the nicest thing you have done for me that I never thanked you for?', 'voice'),
  (67, 'What would you like to be asked about, instead of how I am?', 'either'),
  (68, 'What is something you would like to be better at?', 'text'),
  (69, 'What would you do if you had to describe our friendship in one word?', 'either'),
  (70, 'What is a small thing you would like me to ask you about more?', 'text'),
  (71, 'What is the last thing that made you feel like yourself?', 'voice'),
  (72, 'What would you want me to do if I was having a bad week and did not say anything?', 'text'),
  (73, 'What is something you would like to do this year that is just for fun?', 'either'),
  (74, 'What is a place we should go this year?', 'text'),
  (75, 'What would you like to do together that we have never done?', 'either'),
  (76, 'What do you think we should do more of, just because it is fun?', 'either'),
  (77, 'What is something you would want me to keep doing forever?', 'voice'),
  (78, 'What is one thing that would make this year feel like a good one?', 'either'),
  (79, 'What would you say is the most generous thing I have ever done?', 'voice'),
  (80, 'What is something about you that I would like to understand better?', 'voice')
) as v(ordinal, text, kind)
where p.slug = 'day-ones';