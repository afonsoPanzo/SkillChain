# Handoff: SkillChain — game UI (v2)

## Overview
SkillChain is a mobile-first web game that teaches Solana in 3 levels. Each level = short lesson screens → timed quiz with hearts/combo → an on-chain task signed with the user's wallet (Phantom, Devnet). Points earned on-chain are spent in a shop on avatar cosmetics. Includes daily missions, next-reward progress, rival nudge, leaderboard, sound/vibration, and EN/PT toggle.

Target stack (from the project SDD): Next.js + Tailwind + `@solana/wallet-adapter` + Anchor client. Program instructions referenced: `create_profile` (L1), `complete_level` (L2 transfer 0.01 SOL, L3 create note PDA), `buy_item`, `equip_item`.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing intended look and behavior, not production code. Recreate them in the target codebase (Next.js + Tailwind) using its patterns. All blockchain calls in the prototype are **simulated** (`runTx()` uses timeouts and random signatures); replace with real wallet-adapter + Anchor calls.

Open `SkillChain v2.dc.html` in a browser (keep `support.js` and `Avatar.dc.html` next to it). Markup is inline-styled; all logic, copy (EN + PT), lesson content, items and seed leaderboard data live in the `class Component` script at the bottom of the file — lift constants `L10N`, `LESSONS`, `ITEMS`, `PLAYERS` directly.

## Fidelity
**High-fidelity.** Final colors, type, spacing, states and interactions. Recreate pixel-accurately.

## Layout shell
- Page bg `#0E0F14`. App column centered, `max-width: 480px`, full height, 1px side borders `#1C1E27`.
- **Header** (sticky top): padding 12px 16px, bg `rgba(14,15,20,.92)` + `backdrop-filter: blur(10px)`, bottom border `#1C1E27`. Left: wordmark "Skill" + "Chain" (gradient text `linear-gradient(90deg,#9945FF,#14F195)`), 19px/800, letter-spacing -0.02em; "DEVNET" pill (mono 10px/600, uppercase, `#A15CFF`, border `#3D2466`, radius 999, padding 3px 7px). Right (when connected): points (mono 13px/600 `#14F195`), 34px avatar button → Profile, then language toggle (34px tall, radius 10, border `#2A2E3B`, bg `#171922`, mono 12px/600, shows the *other* language: "PT"/"EN").
- **Main**: padding 22px 18px 32px, flex column, gap 20px.
- **Bottom nav** (sticky, hidden during a lesson): 4 equal tabs (Learn, Shop, Profile, Ranks), height 60px, 14px/700. Active: color `#14F195` + 2px top border `#14F195`; inactive `#9A9CA8`.
- **Toast** (shop/profile tx feedback): above nav, margin 0 16px 10px, padding 14px 16px, radius 14, bg `#20232F`, border = state color, shadow `0 10px 30px rgba(0,0,0,.4)`, 10px status dot; slides up (`translateY(24px)→0`, 0.25s ease-out). Auto-hides 3.2s after confirm/error. Confirmed shows "Explorer ↗" link.

## Screens

### 1. Landing (not connected)
Kicker (mono 12px, uppercase, .08em, `#9A9CA8`): "3 levels · 450 points · 100% on-chain". H1 46px/800, line-height 1.0 (bump to ~1.05 — 1.0 slightly overlaps), -0.035em: "Learn Solana" + green "by playing." Sub 17px/1.5 `#B9BAC4`. 3-col grid of loop cards (Read / Answer / Sign) — bg `#171922`, border `#2A2E3B`, radius 14, padding 14. Primary CTA "Connect wallet". Faucet hint with link to https://faucet.solana.com.

### 2. Learn (map)
- Header: kicker "Path", H2 32px/800 "Learn Solana", progress "{n} of 3 levels done · {pts} of 450 points".
- **Daily missions card** (bg `#171922`, border `#2A2E3B`, radius 18, padding 16, gap 14): title 17px/800 + "Resets in Xh Ym" (mono 12px) counting to local midnight. 3 rows: 26px checkbox (radius 8; done = filled `#14F195` with ✓), label 14px, count "d/goal" mono, 6px progress bar. Missions: finish 1 quiz; reach 5x combo; 3 answers in <5s. All done → "Perfect day…" line (burst anim). **Not in current program scope — needs on-chain/back-end storage or keep local.**
- **Level path**: 3 cards connected by 2px×20px vertical lines (green if level done). Card: radius 18, padding 16, border 1.5px, 4px bottom "3D" shadow. 52px number tile radius 14. States:
  - available: border `#14F195`, shadow `#0B9A5E`, number tile green/ink, chip "PLAY" green bg.
  - done: border `#2A2E3B`, number tile `#20232F` with green numeral, chip "DONE".
  - locked: muted title, number `#5A5D6A`, cursor not-allowed.
- **Next reward card** (when profile exists, tap → Shop): "NEXT REWARD" (12px/700 `#A15CFF`), text e.g. "120 pts to Turbo Goggles" / "You can unlock X now" / "X unlocks at level N", 10px purple progress bar (points/price).
- **Rival card**: avatar 44px, "+150 pts to pass 4hTq…2Zk" / "Finish level N to overtake" (or tie / "You're #1"). Tap → opens next level (or leaderboard if all done). Rival = player directly above you in the sorted leaderboard.

### 3. Lesson (per level)
Top bar: "← Map", combo pill (≥2: green bg, mono 13px, "3x combo", pop scale 1→1.35→1 0.4s on each increment), 3 hearts (20px SVG, `#FF6B5E` / empty `#2A2E3B`; row shakes ±8px 0.4s on wrong answer). Segmented progress: (steps + quiz + task) segments, 6px tall, gap 4; done green, current `#A15CFF`, todo `#2A2E3B`. Tag "Lv N · Title" mono 12px.

- **Steps**: counter (mono green), H2 34px/800, body 18px/1.55 `#C9CAD2`, optional "IN PRACTICE" mono code box. Buttons: Back (secondary) + Next / "Start quiz".
- **Quiz**: counter + seconds left; 6px timer bar (20s per question; turns `#FF6B5E` under 5s). Question 28px/800. Options: min-height 58, radius 16, 2px border, 4px bottom shadow, key tile A/B/C 28px. Correct pick → green tint `rgba(20,241,149,.10)` border `#14F195`; wrong → `rgba(255,107,94,.10)` border `#FF6B5E`.
  - After answering, a **feedback sheet** rises from the bottom (bleeds to column edges, top border 2px state color, bg `#0D2219` correct / `#2A1514` wrong): title ("Nice!"/"Correct!"/"Exactly." · "Not quite." · "Time's up!"), explanation (+" Lightning fast." if <5s), full-width button in state color ("Continue" / "Unlock the task" / "Try again").
  - Wrong or timeout: −1 heart, combo resets. 0 hearts → **Out of hearts** screen (3 empty hearts 36px, "Review the lesson" restarts lesson with 3 hearts).
  - Combo/missions are **visual only — no points bonus**.
- **Task** (kicker "On-chain task · +N pts"):
  - L1 Create profile: Devnet balance card; if 0 → "Request 2 SOL" (airdrop) + faucet link. Button disabled until balance > 0.
  - L2 Send 0.01 SOL: recipient input (mono 13px, 52px), validation: base58 regex `^[1-9A-HJ-NP-Za-km-z]{32,44}$`, not own wallet. Border green valid / red invalid. "Use example" link. Summary "You'll send 0.01 SOL to xxxx…xxxx" + "= 10,000,000 lamports + 5,000 fee".
  - L3 Create note: textarea, 1–100 chars (counter red over 100), seeds hint `["note", wallet]`.
  - Tx progress card: Sign in wallet → Confirming on Devnet → Confirmed (pulsing violet dot for active, green done). Errors in `#FF8A7E`; button becomes "Try again".
  - Already completed → info card, no button.
- **Level complete**: "+150" 80px/800 green (burst anim scale .6→1.08→1), "points earned", 2 stat tiles (Best combo, Hearts left), on-chain proof card with short signature + "View on Solana Explorer ↗" (`https://explorer.solana.com/tx/{sig}?cluster=devnet`). CTA "Start level N+1" / "Go to the shop". Plays level-up sound.

### 4. Shop
Header "You have {pts} points", sub "You can earn 450 in total. Items cost 700. Choose wisely." 2-col grid. Card: radius 18, padding 12, border 1.5px (owned green / affordable purple / else `#2A2E3B`); square preview (Avatar with item applied, or title pill); name 16px/700; meta "Frame · Lv 1"; 6px progress bar (points/price); button 44px: "Buy · 100" (green) / "Owned" / "Requires level N" / "N pts to go" / "Finish level 1" / "Signing…".
Items: Devnet Frame (frame, 100, lv1), Validator Frame (frame, 250, lv3), Turbo Goggles (accessory, 150, lv2), PDA Master (title, 200, lv3).

### 5. Profile
No profile → empty state + "Start level 1". Else: Avatar 168px, equipped title pill, short address; 3 stat tiles (Level n/3, Points green, Total earned); Inventory rows with Equip/Unequip (tx + toast); on-chain note card; Sound & vibration toggle row (ON/OFF).

### 6. Leaderboard
Rival banner (green tint, border green). Rows: grid `28px 40px 1fr auto`, radius 14; position (top 3 green), avatar 40px, short address mono 13, sub (You / title), "Lv N" + "N pts". Sort: level desc, then total earned desc. Current user row: bg `rgba(20,241,149,.07)`, border green.

## Avatar (Avatar.dc.html)
SVG 100×100, layered: rounded square bg (rx 22), body + head circle, two eyes. Color derived from wallet address: `hue = hash(address) % 360`; bg `hsl(h 42% 30%)`, head `hsl(h 55% 66%)`, body `hsl(h 45% 18%)`. Layers: accessory = Turbo Goggles (green lenses); frame 0 = dashed green border; frame 1 = double purple border + diamonds. Props: `hue`, `frame` (255 = none), `accessory` (bool).

## Interactions & sound
- Primary buttons: height 58, radius 16, 800 weight, 5px solid bottom shadow; `:active` translateY(5px) + shadow none.
- Sounds: WebAudio square-wave blips (ok, bad, level-up arpeggio, coin, tap) at gain 0.08; `navigator.vibrate` patterns (ok 25ms, bad [60,40,60], level [40,30,40,30,120]). Respect the sound toggle.
- Tx states: idle → signing → confirming → confirmed | error (cancelled / program error). Map to real wallet-adapter / `confirmTransaction` lifecycle.
- Keyframes: pulse (opacity 1↔.35, 1s), pop (scale), shake (translateX), rise (translateY 24px → 0), burst.

## State
Profile `{level, points, total, items (bitmask), frame, acc, title}` (on-chain PDA `["profile", wallet]`), note (PDA `["note", wallet]`), balance; UI: lang, sound, screen, lvl, stage (steps|quiz|nolives|task|done), step, q, picked, qStart, lives, combo, lessonBest; missions counters (local/daily); tx state + signature.

## Design tokens
- Colors: ink `#0E0F14`, surface `#171922`, surface-2 `#20232F`, line `#2A2E3B`, divider `#1C1E27`, text `#F2F1EC`, text-2 `#C9CAD2`, text-3 `#B9BAC4`, muted `#9A9CA8`, dim `#5A5D6A`, Solana green `#14F195` (pressed shadow `#0B9A5E`, hover `#5CFFB8`), Solana purple `#9945FF` (gradient) / text-safe `#A15CFF`, purple border `#3D2466`, red `#FF6B5E` (shadow `#B5443A`, text `#FF8A7E`).
- Type: Bricolage Grotesque (400–800) for UI; JetBrains Mono (400–600) for numbers, addresses, kickers. Scale: 80/46/34/32/30/28/26/24/20/19/18/17/16/15/14/13/12/11/10.
- Radius: 8, 10, 12, 14, 16, 18, 22 (avatar), 999 pills.
- Spacing: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 28.

## Screenshots & assets
- `screenshots/` — 16 captures of the EN flow (landing → lesson → quiz correct/wrong → task → signing → level complete → map with missions/reward/rival → shop → buying toast → profile → leaderboard) plus the PT map.
- `assets/` — avatar SVGs (base, each item, all items; layers grouped by id), heart icon. See `assets/README.md`.

## Files
- `SkillChain v2.dc.html` — full prototype (all screens, logic, EN/PT copy, content data).
- `Avatar.dc.html` — avatar component.
- `support.js` — prototype runtime only (not needed in production).
