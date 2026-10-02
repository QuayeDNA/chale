# Backend + Frontend Integration — Functional Pass Design

Date: 2026-10-02
Status: Approved
Scope: RPC-first functional integration using only existing UI primitives. No UI polishing.

## 1. Goal
Wire the core Chale loop end-to-end so the app is functionally complete:
pairing → daily question → text + voice answers → locked waiting → reveal → voice expiry/save.
Push notifications and daily scheduler jobs are explicitly deferred.

User decisions locked in:
- Scope: Text + voice loop
- Pairing: invite code + share link (expo-linking)
- Daily prompt: auto-create one per connection per day
- Auth: email OTP at pairing boundary, preserving anonymous identity via linkIdentity

## 2. Architecture
RPC-first on existing Supabase + Expo Router + TanStack Query stack.

Backend (2 new migrations):
- `0003_pairing.sql`: `create_connection()` + `join_connection(invite_code)` as SECURITY DEFINER. Invite code 6-char uppercase, pending → linked. No direct client INSERT.
- `0004_daily_voice.sql`: `get_or_create_today_prompt(connection_id)` (unique per connection per date, random unused partner question), `voice-clips` storage bucket (private, authenticated upload + member read), `voice_listens(answer_id, listener_id, listened_at)` + `record_listen` / `save_own_clip` RPCs, `expires_at` defaults now()+7 days.
- Auth upgrade uses linkIdentity so anon users row and pending connection survive OTP. UID does not change.

Frontend (existing primitives only — Button, Card, Text, TextInput, Badge, Icon, Text):
- Routes: `index` = today state machine (no connection → question → waiting → reveal), `start` = create/join + code + share, `auth` = email OTP verify, `prompt/[id]` = answer + reveal detail.
- Hooks: `useConnection`, `useTodayPrompt`, `useSubmitAnswer` (wraps existing submit_answer), `useVoiceUpload`, realtime subscription on prompts + answers for instant reveal.

## 3. Components
Backend RPCs (single purpose each):
- `create_connection` → connection + invite_code
- `join_connection(code)` → links user_b, flips to linked
- `get_or_create_today_prompt(conn_id)` → prompt + question
- `submit_answer` (existing, reused unchanged)
- `record_listen(answer_id)` + `save_own_clip(answer_id)` (speaker-only save after both listened)

Frontend composition (functional only):
- `ConnectionInvite`: code display + Copy/Share + pending state
- `QuestionCard`: question text + Text/Voice toggle
- `AnswerComposer`: TextInput + submit, or recorder (start/stop/preview/send) from Button + Text
- `WaitingState`: "You answered, tucked away until they answer"
- `RevealCard`: both answers side-by-side, voice as play + duration
- `SaveVoicePrompt`: speaker-only after both listened
- Relationship accent as label/border only. No new UI kit.

## 4. Data flow
anon browse (3 sample questions) → Start → OTP linkIdentity → create/join → get_or_create_today_prompt → submit via submit_answer → realtime prompts.reveal_state flip → reveal reads both answers (RLS blocks early read).
Voice: upload to `voice-clips/{answer_id}.m4a` → submit_answer(kind=voice, content=url) → record_listen each side → speaker sees save prompt.

## 5. Error handling
- Resubmit = no-op (on conflict do nothing, first answer wins, per 04-user-flows.md).
- Bad/used invite code = explicit "not found / already linked" from RPC.
- Offline submit = Query retry 1x then inline error text, no toast system.
- Voice upload fail = keep local URI, allow retry, no answer row until upload succeeds.

## 6. Testing
- SQL-level: partner answer unreadable pre-reveal, double-submit keeps first, double-join fails.
- App-level: manual two-device check (Android + web) for create → join → both answer → simultaneous reveal, plus voice listen → save → expiry flag.
- `expo lint` + `tsc --noEmit` clean. No UI snapshot tests in this pass.

## 7. Explicit non-goals
No push notifications, no scheduler/cron, no streaks, no timeline, no photo answers, no premium packs, no groups, no UI polish pass. Those follow after this functional loop is verified.
