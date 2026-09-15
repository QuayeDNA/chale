# 07 · Library Research

**Date:** 2026-09-15 · **Scope:** Library decisions for Chale's design-system + user-flow-polish phase (pre-Phase 1 MVP). Research only; no application code written. All claims verified against primary sources (official docs, npm registry metadata, GitHub issues/PRs, Expo SDK 57 docs, release notes); URLs cited inline.

---

## Constraints snapshot

- **Fixed stack:** Expo SDK ~57.0.22, React 19.2.3, react-native 0.86.3, expo-router ~57.0.21, TS ~6.0.3 strict, React Compiler experiment ON, typedRoutes ON. Expo SDK 57 = RN 0.86 (non-breaking release) + React 19.2.3, published 2026-06-30 (<https://expo.dev/changelog/sdk-57>; <https://reactnative.dev/blog/2026/06/11/react-native-0.86>).
- **New Architecture is mandatory and cannot be disabled (RN >= 0.82 / SDK 57).** Third-party libs must be New-Arch-compatible (<https://docs.expo.dev/guides/new-architecture/>; "Starting with React Native 0.82, the New Architecture is always enabled and cannot be disabled").
- **React Compiler:** Expo's build only compiles app code, not node_modules; libs must tolerate compiler semantics in their app-facing APIs (<https://docs.expo.dev/guides/react-compiler/>).
- **Already installed:** reanimated 4.5.1, react-native-worklets 0.10.1, gesture-handler ~2.32.0, expo-image, expo-font ~57.0.4, expo-glass-effect, @expo/ui (beta), expo-symbols ~57.0.3, expo-system-ui, expo-status-bar, safe-area-context ~5.7.0, @supabase/supabase-js ^2.116.0, async-storage 2.2.0. SDK 57 also pins `react-native-svg` 15.15.4, `expo-audio` ~57.0.5, `expo-video` ~57.0.4, `expo-notifications` ~57.0.18 (verified in local `node_modules/expo/bundledNativeModules.json`).
- **Platform:** Android first (dev builds via `npx expo run:android`); iOS + web later; web is `expo web` SPA single-output. Dev-client-only libs are acceptable but must be flagged.
- **Requirement:** token-based theme (foundational tokens fixed + contextual accent keyed by `relationship_type` that switches at runtime without redesign) + light/dark; small primitive set; small reveal transition later (<https://github.com/…> see `docs/05-design-system.md`).

---

## 1. Theming / styling system

Candidates verified: NativeWind (v4 stable / v5 RC), unistyles, tamagui, dripsy (note: "dribsly" does not exist), Shopify Restyle, plain StyleSheet, RN core appearance APIs.

### 1.1 Compatibility verification (primary sources)

| Candidate | Stack facts (dated 2026-09) | Source |
|---|---|---|
| **NativeWind v4.2.7** | npm `latest` is still **4.2.7** (published 2026-09-14). Tailwind v3 runtime via `react-native-css-interop`; Metro + Babel setup, no native code. RN-version-agnostic, New-Arch-required beyond a point; lots of New-Arch styles need it. | <https://www.npmjs.com/package/nativewind>; <https://www.nativewind.dev/v5/guides/migrate-from-v4> |
| **NativeWind v5 (RC)** | v5 is explicitly "a release candidate using Tailwind CSS v4 and react-native-css" (<https://www.nativewind.dev/v5/>). Requires Tailwind >= 4.1, **RN 0.81+**, **New Architecture**, **Reanimated v4+** (<https://www.nativewind.dev/v5/guides/migrate-from-v4>; <https://www.nativewind.dev/v5/llms.txt>). Official compat notes target **exactly our stack: Expo 57.0.22 / RN 0.86.3 / React 19.2.3 / Reanimated 4.5.1 / Worklets 0.10.1** (<https://github.com/nativewind/nativewind/blob/main/docs/rc-compatibility.md>; <https://github.com/nativewind/nativewind/blob/main/docs/expo57-rc.md>). v5 requires **no Babel config**, does it via Metro. | nativewind.dev v5 + nativewind/nativewind repo |
| **unistyles 3.3.0** | Latest published 2026-07; dev-tested against React 19.2.3 / RN 0.85.3 / **Reanimated 4.3.1** / RNW 0.21; peer `react-native >= 0.76.0`. New-Arch-first (TurboModule + nitro). **Not usable in Expo Go** (custom native code). First-class web + SSR. Official React Compiler guide (Babel plugin must run before compiler). Uses its own `StyleSheet.create` override; drop-in syntax fit. | <https://registry.npmjs.org/react-native-unistyles/latest>; <https://unistyl.es/v3/start/getting-started/>; <https://unistyl.es/v3/guides/react-compiler/>; <https://unistyl.es/v3/other/frequently-asked-questions/> |
| **tamagui 2 (2.5.x)** | Tamagui 2 requires RN 0.81+ New Arch, React 19+, TS 5+ — matches versions on paper. BUT: official react-native-reanimated integration has a **known worklet-rule violation bug** — Tamagui's animation driver mutates nested properties of a shared value inside a worklet (<https://github.com/tamagui/tamagui/issues/4148>; surfaced with React 19 `<Activity>` + Navigation 8). React Compiler + Tamagui has an open "integrating" discussion from the Expo 53 era with no resolution tracked (<https://github.com/tamagui/tamagui/discussions/3605>). | <https://tamagui.dev/blog/version-two>; <https://tamagui.dev/llms-full.txt>; tamagui/tamagui#4148; #3605 |
| **dripsy 4.3.8** | Last publish **2024-10-22** (≈2y dormant), single maintainer, built on `@theme-ui/css`, dev-tested against nothing newer than TS 5.2. No New-Arch/RN-0.86 story. ("**dribsly**" was also checked: **zero packages** on npm registry search, no GitHub repo, no resolving domain — it does not exist; assume candidate meant dripsy.) | <https://registry.npmjs.org/dripsy/latest>; <https://registry.npmjs.org/-/v1/search?text=dribsly> |
| **Restyle (Shopify) 2.4.5** | Pure-JS (type-safe `Box`/`Text`/variants). Last publish **2025-03-19**; dev-tested against RN 0.72 / React 18. Peer deps `*`; works anywhere but has no New-Arch-specific testing or adaptive light/dark. | <https://registry.npmjs.org/@shopify/restyle/latest>; <https://shopify.github.io/restyle/> |
| **StyleSheet + RN core** | RN 0.86 has **no shipped "static theme" API** — the built-in theming surface is `Appearance`/`useColorScheme` + `StyleSheet` (<https://reactnative.dev/docs/appearance>). Typed tokens via TS `as const` + a `ThemeProvider` context are fully viable at our scale — zero dependency risk. | reactnative.dev/docs/appearance |
| **unistyles vs our needs** | Runtime theme swap: supported via `UnistylesRuntime.setTheme` + unlimited named themes + auto light/dark adaptive themes (<https://unistyl.es/v3/guides/theming/>). Theme used in worklets: first-class `useAnimatedTheme` shared value (`react-native-unistyles/reanimated`) — no re-renders, worklet-safe (<https://unistyl.es/v3/guides/reanimated/>). No component library (by design). | unistyl.es |

### 1.2 Our-constraints analysis

- The one hard requirement — **runtime context-keyed accent switching without a redesign** — maps directly onto unistyles' "unlimited named themes + `setTheme`" and tamagui's "themes" concept. It maps poorly onto NativeWind classes (you end up maintaining a runtime class-string mapping layer) and onto restyle/dripsy (whole-provider theme swap + no worklet support).
- `relationship_type` themes are small (one accent object) and coexist orthogonally with light/dark. Unistyles breaks this into a clean 2-axis model (color-modes × context themes).
- React Compiler: unistyles ships an explicit guide; NativeWind v5 does **not document** React Compiler behavior; tamagui is actively buggy here.
- Bundle/runtime cost: NativeWind pulls Tailwind tooling + css-interop; tamagui is a large framework; unistyles is a focused native module + zero-runtime-over-head `StyleSheet` override; plain StyleSheet is zero-cost but hand-rolled for theme-in-worklet + pseudo/variants.
- One operational cost: **unistyles needs a dev build (no Expo Go)**. Chale already develops with `expo run:android` (prebuild + `android/` in repo), so this is acceptable.

### 1.3 Decision

**Adopt `react-native-unistyles` 3.3.0 as the styling layer** (tokens via `StyleSheet.create`/`StyleSheet.configure`, typed; a `light`+`dark` color-mode pair × a theme record per `relationship_type`, switched at runtime with `UnistylesRuntime.setTheme`). **Build custom primitives on top (see §2).** Do **not** adopt NativeWind, tamagui, dripsy, or restyle.

- No-extra-dependency fallback (if a no-native-dep constraint ever appears): plain `StyleSheet` + React Context + `useColorScheme` — adequate for the MVP primitive set, and can be swapped for unistyles later without redesign because tokens stay typed objects.

---

## 2. Component primitives / UI kit

Candidates verified: React Native Paper, gluestack-ui v2, tamagui-as-kit, NativeBase, hand-rolled primitives.

### 2.1 Compatibility verification

| Candidate | Facts (2026-09) | Source |
|---|---|---|
| **react-native-paper 5.15.3** | Material Design kit. npm `latest` = 5.15.3; dev-tested on RN **0.82.1** (not 0.86); peer deps are permissive (`react *`, `react-native *`). Long-running New-Arch issue history is mostly resolved by the 0.82-era dev matrix. **But** it is a Material-spec kit: its look/theme and component semantics fight a brand-custom design system (speech-bubble cards, Pidgin microcopy). | <https://registry.npmjs.org/react-native-paper/latest>; <https://callstack.github.io/react-native-paper> |
| **gluestack-ui v2** | NativeBase's successor (copy-paste components). Open issues: "Support for react-native 0.7x" (#2573) — no RN 0.8x-era validation; Expo SDK 51 compat issue (#2142). Theming machinery (`tva`, `cssInterop`, per-engine mappers for NativeWind/UniWind) is still in flux. | <https://github.com/gluestack/gluestack-ui/issues/2573>; /issues/2142; <https://gluestack.io/> |
| **tamagui as a component kit** | Same risks as §1: worklet-mutation bug in its own animation driver, React Compiler uncertainty, large compiler-based pipeline for a 10-component need. | tamagui/tamagui#4148; #3605 |
| **NativeBase** | **Discontinued.** README: "NativeBase is entering maintenance mode as we evolve into gluestack-ui." Expo's own issue tracker also states "nativebase is not maintained anymore." | <https://github.com/GeekyAnts/NativeBase>; <https://nativebase.io/>; <https://github.com/expo/expo/issues/32907> |
| **Hand-rolled primitives** | Small surface: button, text input, card (speech-bubble), badge, toggle, pressable, list row. RN core `Pressable` + a11y props + unistyles variants cover the whole set; reanimated handles the reveal later. Zero foreign design language; every pixel matches the brand; no approval-bottleneck. | — |

### 2.2 Constraints analysis

- The product needs a *small* set of custom-branded, themable primitives ("speech-bubble feel", relationship accents). Kits impose Material/gluestack semantics and token shapes that must be fought and overridden to reach the brand.
- Kits are also the top source of New-Arch + React-Compiler drift on RN 0.86 (paper tests 0.82; gluestack < 0.8x).
- A11y/state layer is small: RN core `Pressable` + `accessibilityRole`/`accessibilityState` + `AccessibilityInfo` + unistyles variants is sufficient; no need for aria-polyfill stacks at MVP scope.

### 2.3 Decision

**Hand-rolled primitives on RN core (`Pressable`, `Text`, `TextInput`) + unistyles variants + reanimated.** No component kit. Optional nursing: a tiny `createPrimitive`/`useA11yState` helper in `src/components/primitives`.

---

## 3. Icons

**Important 2026 change:** `@expo/vector-icons` is **being deprecated** and is no longer recommended by Expo; the official path is the `@react-native-vector-icons/*` icon-pack packages (<https://docs.expo.dev/guides/icons/>; <https://expo.dev/blog/moving-away-from-expo-vector-icons>). Cradle claim in that post: switching to `@react-native-vector-icons/*` cut their repro bundle by **~4 MB** (font-based packs, vs @expo/vector-icons bundling all font assets).

| Candidate | Facts (2026-09) | Source |
|---|---|---|
| **expo-symbols ~57.0.3** | **No longer iOS-only.** SDK 57 docs: SF Symbols on iOS/tvOS, **Material Symbols on Android AND web**, cross-platform `name={{ios,android,web}}` + per-platform weights + `fallback`. Caveats: no filled-state rendering on Android/web (#46850, open), two different glyph systems (weight consistency across iOS↔Android is not guaranteed), native module. | <https://docs.expo.dev/versions/latest/sdk/symbols/>; <https://github.com/expo/expo/issues/46850> |
| **@expo/vector-icons** | Deprecated at source; don't start on it. | <https://expo.dev/blog/moving-away-from-expo-vector-icons> |
| **@react-native-vector-icons/* (esp. `/lucide`)** | Expo-endorsed successor (v13.x). Font-glyph-based: works in Expo Go, dev builds, all platforms. Glyph data comes with the whole pack; names are strings (not typed icons); tradeoff vs SVG. | <https://www.npmjs.com/org/react-native-vector-icons>; expo.dev blog above |
| **lucide-react-native 1.46.0** | Actively maintained (published 2026-09-14). Typed React components, ESM, **`sideEffects: false`**, single consistent 2px stroke weight across the whole set (→ satisfies the design doc's "consistent icon set/weight" foundational rule). Requires `react-native-svg` ^12–15 (SDK 57 already pins **15.15.4**; maintained by Software Mansion). Per-icon subpath exports (`lucide-react-native/icons/<name>`) added in #4522 to fix **Metro bundling the entire icon set when importing from the index** (#4442) — on **web** the index tree-shakes, on **native Metro you must import per-icon subpaths** (or all ~9.5k icons ride along). | <https://registry.npmjs.org/lucide-react-native/latest>; <https://lucide.dev/guide/react-native>; <https://github.com/lucide-icons/lucide/issues/4442>; /pull/4522; <https://registry.npmjs.org/react-native-svg/latest> |
| **react-native-vector-icons (v-monolith)** | Deprecated; superseded by scoped packages (expo blog). | expo.dev blog |

### 3.1 Decision

**Adopt `lucide-react-native`**, importing **per-icon from `lucide-react-native/icons/<name>`** (never the root index) so native Metro tree-shakes; install `react-native-svg` (15.15.x, SDK-57-pinned). One glyph system, one weight, typed names — works on Android + web now, iOS later, and does not depend on per-platform symbol naming like expo-symbols.

- If bundle weight of react-native-svg later hurts: fall back to `@react-native-vector-icons/lucide` (same glyph family, font-based, Expo-endorsed). Keep either choice inside a thin `src/components/icon.tsx` vet to keep the swap cheap.

---

## 4. Fonts

### 4.1 Verified facts

- **Loading pattern (expo-router + splash):** map fonts in the root layout with `useFonts` from `expo-font`, hold `SplashScreen.preventAutoHideAsync()` until loaded, then `hideAsync()` — this is the documented Expo pattern and works on Android/iOS/web <https://docs.expo.dev/develop/user-interface/fonts/>).
- **Spline Sans available:** `@expo-google-fonts/spline-sans` **0.4.2 exists on npm** (published 2025-09, `MIT AND OFL-1.1`) — the design doc's web-font candidate is loadable today via expo-font on all three platforms <https://registry.npmjs.org/@expo-google-fonts/spline-sans/latest>; repo: <https://github.com/expo/google-fonts>).
- **Self-host vs fetch:** `@expo/google-fonts` packages **self-host the font files in the package**, so offline-first on device (no runtime network dependency, no Google Fonts-fetch licensing/URL issues). Runtime Google-Fonts-fetch is not a pattern for RN. The `expo-font` config plugin can also embed fonts at build time for native; web loads via `useFonts` (config plugins don't run on web) — <https://docs.expo.dev/develop/user-interface/fonts/>.

### 4.2 Decision

**`@expo-google-fonts/spline-sans` loaded in the root `_layout.tsx` via `useFonts` + splash hold**, per the fonts guide. Fonts live in the token layer (§1) so the pairing can be changed without touching components. Confirm static weight files exist for the weights we need (variable-font axis support in the package should be checked when locking the type scale).

---

## 5. Animation

| Candidate | Facts | Source |
|---|---|---|
| **reanimated 4.5.1 (+ worklets 0.10.1) — already installed** | New-Arch-only (fine). Ships classic worklets + useAnimatedStyle/shared values + new CSS-style transitions/keyframes + layout animations. React Compiler: covered at library level (e.g. `useSharedValue` has React Compiler support; there were compiler bugs — react/react#32580 `enableFunctionOutlining` broke reanimated callbacks — later fixed). Web: JS fallback (acceptable for preview). | <https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/>; <https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/>; <https://github.com/react/react/issues/32580>; /docs/guides/web-support |
| **Moti 0.30.0** | Last release **2025-01-29**, still documents "Powered by **Reanimated 3**" and dev-tests `react-native-reanimated@3.11.0`; peer is `*` so it installs, but there is **no verified Reanimated-4.x / worklets-0.10 story** and no React Compiler guidance. Maintenance risk on our stack. | <https://registry.npmjs.org/moti/latest>; <https://github.com/nandorojo/moti> |
| **react-native-skia** | Heavy native lib for vector/2D effects. The reveal moment (scale + fade + spring) is trivially covered by reanimated keyframes/layout-animations; Skia is unwarranted now. Revisit only if the reveal becomes a particle/curve effect. | — |

### 5.1 Decision

**No new animation library — use reanimated 4.5.1 directly.** Micro-interactions via `withSpring`/`withTiming` + `useAnimatedStyle`; the reveal via `Animated.View` entering/exiting + a deliberate `withSpring` scale/fade timeline (or a CSS-transition declarative style if preferred — Reanimated 4 API). Layout animations on the answer-card list via `LinearTransition`/`FadeIn`. Moti is a wrapper we don't need and whose reanimated-4 story is unverified.

---

## 6. Data fetching (Supabase questions/prompts)

| Candidate | Facts | Source |
|---|---|---|
| **TanStack Query v5** | `@tanstack/react-query` **5.102.8**; peer `react: ^18 || ^19`, and the installation docs state "compatible with React v18+ and works with ReactDOM and React Native." Typed, caching/dedup, mutations, `refetchInterval` (polling for the reveal race), and official Supabase usage patterns. Used with `@supabase/supabase-js` ^2.116 (already installed) — no extra runtime. | <https://registry.npmjs.org/@tanstack/react-query/latest>; <https://tanstack.com/query/latest/docs/framework/react/installation> |
| **SWR 2.5.1** | peer `react: ^16.11 || ^17 || ^18 || ^19` — works. Lighter than TanStack Query but fewer primitives: no built-in polling config surface, no devtools, weaker mutation/selection patterns. | <https://registry.npmjs.org/swr/latest> |
| **Plain hooks around supabase-js** | Zero deps. Adequate while the surface is ~3 queries, but gains no cache/invalidation/realtime affordances for the reveal race and screen-to-screen cache reuse. | — |

### 6.1 Decision

**TanStack Query v5 + supabase-js.** Covers today's question-list / today's-prompt reads and tomorrow's reveal race (`refetchInterval` or subscription badge without fighting the cache). React 19 is in its peer range. Keep it to the standard client; do not adopt the legacy supabase-react binding.

---

## 7. Forms (account/pairing; pairing deferred)

**react-hook-form 7.88.0** (peer `react ^16.8 || ^17 || ^18 || ^19`, actively maintained) + `@hookform/resolvers` 5.9.1 + `zod` for `zodResolver` typing <https://registry.npmjs.org/react-hook-form/latest>, <https://registry.npmjs.org/@hookform/resolvers/latest>.

### 7.1 Decision

**Standardize now on react-hook-form + zod + resolver.** Even though pairing is deferred, onboarding/account fields land in Phase 1; building the pattern once avoids a churn later. (For a single 2-field form, a plain controlled component is fine — use RHF once form complexity exceeds that.)

---

## Forward notes

**(a) Audio (voice answers, later phase).** `expo-av` is deprecated — the `Audio`/`Video` APIs were replaced by `expo-audio` and `expo-video` (<https://docs.expo.dev/versions/latest/sdk/av/>), and **SDK 57 no longer bundles `expo-av` at all** (absent from `bundledNativeModules.json`; `expo-audio ~57.0.5` and `expo-video ~57.0.4` are pinned). Plan the walkie-talkie phase on **`expo-audio`** (`useAudioRecorder`, `RecordingPresets`, `enableBackgroundRecording` config) — <https://docs.expo.dev/versions/latest/sdk/audio/>. Do not begin any new code with `expo-av`.

**(b) Push notifications (later).** `expo-notifications ~57.0.18` is bundled and maintained (<https://docs.expo.dev/versions/latest/sdk/notifications/>; version from local SDK 57 manifest). Standard remote-push flow: EAS project already configured (`app.json` → eas.projectId). Plan a thin abstraction (request permission, persist Expo push token, handle display) so nothing blocks the reveal race when that ships.

**(c) expo-glass-effect production-readiness.** iOS-26-only (Liquid Glass via `UIVisualEffectView`); Expo's own SDK-54 changelog calls UIKit path "the best choice for most Expo apps today" (<https://expo.dev/changelog/sdk-54>). **Not production-clean yet:** known bug where `GlassView` `colorScheme` prop doesn't re-apply the effect on in-app theme toggle (<https://github.com/expo/expo/issues/43743>) and a report of glass disappearing after tab change (<https://github.com/expo/expo/issues/43732>). Treat as an iOS-26 enhancement layer later; it must not gate the Android-first design system, and theme-dependent glass needs re-verification before use.

---

## Decisions summary

| # | Area | Chosen approach | Why (one line) | Source |
|---|---|---|---|---|
| 1 | Theming/styling | **unistyles 3.3.0** | Named runtime themes (light/dark × relationship accent) + typed tokens + worklet-safe theme access; New-Arch-first; needs dev build | <https://unistyl.es/> |
| 2 | Primitives/UI kit | **Custom primitives** (RN core + unistyles variants) | Small branded surface; kits are Material/gluestack-shaped, lag RN 0.86, or conflict w/ brand | <https://unistyl.es/v3/guides/reanimated/> |
| 3 | Icons | **lucide-react-native** (per-icon subpath imports) + react-native-svg | One typed, same-weight glyph system on Android+web; native tree-shaking via `lucide-react-native/icons/*` | <https://lucide.dev/guide/react-native> |
| 4 | Fonts | **@expo-google-fonts/spline-sans** via `useFonts` + splash hold | Exists on npm, self-hosted/offline-safe, token-layer swappable | <https://registry.npmjs.org/@expo-google-fonts/spline-sans/latest> |
| 5 | Animation | **reanimated 4.5.1 directly** | Already installed; covers micro/reveal/layout; Moti is stale reanimated-3-era | <https://docs.swmansion.com/react-native-reanimated/> |
| 6 | Data fetching | **TanStack Query v5 + supabase-js** | Cache + polling today, reveal-race + realtime later; React 19 peer-supported | <https://tanstack.com/query/latest/docs/framework/react/react-native> |
| 7 | Forms | **react-hook-form + zod (+ @hookform/resolvers)** | Standard, React-19-safe, pattern-once for Phase 1 account forms | <https://react-hook-form.com/> |

## Red flags (must-know)

1. **`@expo/vector-icons` is deprecated** — do not use it (this changes the SDK 57-era icon default most tutorials still show). `expo-symbols` is no longer iOS-only (Material Symbols on Android/web) but can't render filled states on Android/web (#46850).
2. **New Architecture is mandatory on RN 0.82+/SDK 57** — every chosen lib must be New-Arch-clean; unistyles/Paper/gluestack were graded against that (Paper tests RN 0.82, gluestack hasn't validated 0.8x).
3. **NativeWind v5 is still RC** (targeted at exactly our stack, but RC-class); NativeWind v4 (stable) is a Tailwind-v3 utility model that fits our token-context requirement poorly.
4. **Tamagui has a live reanimated worklet-mutation bug** and an open React-Compiler discussion — do not adopt despite version-matrix fit.
5. **Moti has no verified Reanimated-4 support** (last release Jan 2025, Reanimated-3-documented).
6. **Dribsly does not exist** (npm/GitHub/domain all 404) — candidate was almost certainly "dripsy" (also dormant since Oct 2024). Drop both.
7. **unistyles requires a dev build (no Expo Go)** — fine for this project (`expo run:android`), must be explicit in onboarding docs.
8. **lucide on native Metro bundles all icons from the index import** — enforce `lucide-react-native/icons/<name>` imports (or use the font-pack fallback).
9. **expo-glass-effect is not theme-toggle-safe yet** (#43743) — defer any glass-dependent UI.
10. **React Compiler:** Expo only compiles app code; keep the compiler-safe subset of libs recommended above (unistyles ships a compiler guide; tamagui/Moti do not).