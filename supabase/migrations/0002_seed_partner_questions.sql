-- Chale — Phase 0: initial Partner question pack (~100 questions).
-- Content is curated for the 'partner' relationship type and a beta audience.
-- Kind distribution: text-led, voice-led (short, spoken-answer friendly), and
-- 'either' (works great both ways). The `text` column stores the prompt copy;
-- this seeding is replaced by the content pipeline once one exists (roadmap).

with new_pack as (
  insert into question_packs (title, category, relationship_type)
  values ('Partner Pack', 'core', 'partner')
  returning id
)
insert into questions (pack_id, text, kind)
select new_pack.id, q.text, q.kind::question_kind
from new_pack,
(values
  -- ---------- everyday & sharing ----------
  ('What was the best part of your day that I wasnt there for?', 'text'),
  ('Whats one small thing youre looking forward to this week?', 'text'),
  ('If you could trade lives with me for one day, what would you want to try first?', 'voice'),
  ('What song have you had on repeat lately?', 'text'),
  ('Describe your day in exactly three words.', 'voice'),
  ('What did you eat today that you actually enjoyed?', 'text'),
  ('Whats something funny that happened today, even if it was tiny?', 'voice'),
  ('What are you working on right now that you secretly enjoy?', 'text'),
  ('Who made you feel good today?', 'text'),
  ('Whats one thing youd rather tell me than type?', 'voice'),

  -- ---------- hopes & dreams ----------
  ('Whats a dream youve never actually said out loud?', 'voice'),
  ('If money werent a factor, what would you do next year?', 'text'),
  ('What place would you love for us to visit together?', 'either'),
  ('What skill do you wish you had by this time next year?', 'text'),
  ('If you had a whole free day with no obligations, how would you spend it?', 'voice'),
  ('Whats one thing from your childhood youd want to relive for a day?', 'voice'),
  ('What hobby have you always wanted to start but havent?', 'text'),
  ('What would success look like for you in five years, honestly?', 'either'),
  ('Whats a big goal you have that you keep to yourself?', 'text'),
  ('If you could teleport anywhere for dinner tomorrow, where are we eating?', 'voice'),

  -- ---------- depth & vulnerability ----------
  ('Whats something you worry about that you dont usually say out loud?', 'text'),
  ('When was the last time you cried, and why?', 'either'),
  ('Whats a fear you have about us, stated gently.', 'text'),
  ('What part of your past are you most proud to have survived?', 'either'),
  ('What do you need more of from me?', 'text'),
  ('What do you feel you dont get to express enough?', 'voice'),
  ('Whats a boundary you wish I understood better?', 'text'),
  ('When do you feel safest with me?', 'either'),
  ('Whats been on your mind lately that you havent told me yet?', 'voice'),
  ('What question do you wish I would ask you?', 'voice'),
  ('Whats a moment you felt truly understood by me?', 'either'),
  ('Whats something youve been carrying that isnt mine to carry?', 'either'),

  -- ---------- playful & fun ----------
  ('Whats the most embarrassing thing I have ever said to a stranger?', 'voice'),
  ('Whats your guilty-pleasure TV show?', 'text'),
  ('If our relationship were a movie, what genre would it be?', 'voice'),
  ('Whats a ridiculous thing you would do for a million dollars?', 'voice'),
  ('Whats an inside joke we need to start?', 'either'),
  ('Whats the weirdest food combo you secretly love?', 'text'),
  ('Whats a talent you have that I dont know about yet?', 'voice'),
  ('If you had to describe me as a weather pattern, what would I be?', 'voice'),
  ('Whats the most "you" thing you did this week?', 'either'),

  -- ---------- memory lane ----------
  ('Tell me a memory from our early days that you replay often.', 'voice'),
  ('What was the moment you knew I was special to you?', 'either'),
  ('Whats a trip or outing we did that youd relive?', 'voice'),
  ('Whats something I did that made you laugh so hard it hurt?', 'voice'),
  ('Whats a habit of mine youve grown to love?', 'text'),
  ('Whats the first thing you noticed about me?', 'either'),
  ('What memory of us makes you smile on a bad day?', 'voice'),
  ('Is there a song that reminds you of us? What moment does it take you back to?', 'either'),
  ('What do you remember about the day we met?', 'voice'),

  -- ---------- us & our future ----------
  ('Whats a promise you want to make to us going forward?', 'voice'),
  ('What tradition should we start together?', 'either'),
  ('Whats a first you are excited for us to have?', 'either'),
  ('Whats something new you want to learn about me?', 'voice'),
  ('If we checked in once every year on the same day, what should we ask each other?', 'voice'),
  ('What makes you feel closest to me?', 'either'),
  ('What small thing do you want us to do more of together?', 'text'),
  ('Whats a change we made recently that is working well?', 'text'),
  ('Whats one thing about our relationship youd never want to lose?', 'either'),
  ('If you could give future-us one piece of advice, what would it be?', 'voice'),

  -- ---------- feelings & appreciation ----------
  ('What do you appreciate about me that you dont say enough?', 'either'),
  ('Whats something I do that makes you feel loved?', 'text'),
  ('What made you choose me?', 'either'),
  ('Whats something I did lately that you are proud of?', 'text'),
  ('Whats your favourite thing about how we communicate?', 'text'),

  -- ---------- confessions & little things ----------
  ('Whats a small thing you do that you hope I have noticed?', 'either'),
  ('Whats been your favourite "Chale" moment with me?', 'voice'),
  ('What is something you started liking because I like it?', 'either'),

  -- ---------- voice-led, quick & conversational ----------
  ('Good evening, Chale: whats the one thing on your mind today?', 'voice'),
  ('If I were next to you right now, what would you want to do?', 'voice'),
  ('Say the first thing that comes to mind when you think of me.', 'voice'),
  ('If our day had a soundtrack, which song is playing right now?', 'voice'),
  ('Whats the last thing that genuinely made you laugh?', 'voice'),
  ('Describe your mood right now in three seconds of atmosphere.', 'voice'),
  ('Whats a thought you had today that started with "I should tell Chale..."?', 'voice'),
  ('If you could send me one sound from where you are right now, what would it be?', 'voice'),

  -- ---------- still & thinking texts ----------
  ('Whats a question you would rather answer in writing than out loud?', 'text'),
  ('Whats the kindest thing a stranger did for you this week?', 'text'),
  ('Whats a habit you are trying to break or build right now?', 'text'),
  ('Whats something about your day you want me to know that didnt fit anywhere else?', 'text'),
  ('Whats your current obsession, show, food, hobby, or otherwise?', 'text'),
  ('Whats something you used to believe that you no longer do?', 'text'),
  ('Whats a small win you had recently?', 'text'),
  ('Whats something you want to be braver about?', 'text'),
  ('Name three things you are grateful for today.', 'text'),
  ('Whats the best advice you have ever received?', 'text'),
  ('Whats something you want to get better at, just for fun?', 'text'),

  -- ---------- either, the middle ground ----------
  ('Whats something you want to try together that scares you a little?', 'either'),
  ('What does a good day look like for you, hour by hour?', 'either'),
  ('Whats a season of your life youd revisit?', 'either'),
  ('Whats something we disagree on that you are glad we do?', 'either'),
  ('Whats a tradition from your family youd want to bring into ours?', 'either'),
  ('Whats something you changed your mind about because of me?', 'either'),
  ('Whats a place that feels like home to you, and why?', 'either'),
  ('Whats something youd defend me on without hesitation?', 'either'),
  ('What memory of me do you have that I probably dont remember?', 'voice'),
  ('Whats one thing you hope we are still doing together in ten years?', 'either'),
  ('Whats something ordinary youd love to make special with me?', 'either'),
  ('What would you want me to remember about you in twenty years?', 'either'),
  ('Whats the last thing you said to me that you meant more than I realized?', 'either')
) as q(text, kind);