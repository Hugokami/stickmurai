# Stickmurai Quality of Life Implementation Plan

> Execute task by task with the subagent-driven-development skill, followed by integration review and browser checks. The user approved all proposed improvements and deployment on 2026-09-05.

**Goal:** Deliver the agreed UI, controls, feedback, practice, loading and save improvements to the existing Vercel project.

**Architecture:** Add focused quality-of-life modules around existing game callbacks. Preserve combat animations, balance and stage reset rules. Practice is isolated from persisted progression; settings and saves are validated. Supabase cloud saves are a later optional extension, as proposed; this release implements local protection and accurate offline status.

**Tech Stack:** Existing TypeScript/Vite/Canvas/DOM stack; no frontend framework migration.

## 1. Progression clarity and browsing
- Modify src/ui.ts and src/powerups.ts; add focused module/styles as needed.
- Numeric before/after cards and caps, stage-only/permanent labels, current levels.
- Stage briefing with actual objective/modifier/rewards; owned/locked/affordable hero filters, comparisons and currency shortfall.
- Purchase feedback and stage personal-best comparisons.
- Verify computed previews do not mutate game state and capped upgrades report accurately.

## 2. Controls and accessibility
- Add src/qol.ts and src/qol.css; integrate with src/input.ts and src/audio.ts.
- Persist adjustable action positions/size/opacity, handedness and joystick sensitivity; provide defaults and live layout editor.
- Readable text/HUD sizes, separate SFX volume, consistent Back navigation and offline status.
- Add short configurable attack/dash buffer with single consumption and state clearing.
- Verify keyboard/touch/controller paths and mobile landscape layouts.

## 3. Runtime safety and gameplay feedback
- Modify src/main.ts, src/assets.ts and index.html; isolate practice state.
- Required asset readiness and retry; preserve at least 15 seconds before recovery UI.
- Solo focus-loss pause, released held inputs, safe countdown resume.
- Death source/objective summary and same-loadout retry.
- Locked hero practice against dummy and optional sparring with no currency/progression writes.
- Bounded offscreen attack warnings and shape-coded attack types.
- Verify loading failure, interruption, practice exit and stage clear races.

## 4. Save protection
- Add explicit allowlisted, versioned local save export/import with schema validation, automatic backup before replacement and restore option.
- Never include auth tokens or unrelated localStorage values; prevent practice rewards from being written.
- Add semantic tests for malformed imports, range/type validation, buffering and progression previews.

## 5. Integration and release
- Typecheck, production build, tests, real-browser desktop and mobile flows, failure-path tests and independent review.
- Refresh Graphify; document actual results and limitations.
- Deploy the verified output to the existing Vercel project using the user's stored token without printing it.
- Verify production responds and serves the new build. No need to request deployment permission again.
