# Stickmurai: Codex handoff

Prepared 2026-09-05 from local source, the Antigravity handoff and session artifacts,
recent user messages in the full transcript, and local build verification.

## Current baseline

- Project: `C:/Users/lyan1/Documents/stickmurai`.
- Branch: `main`; starting HEAD: `f4f43e0`.
- Remote: https://github.com/Hugokami/stickmurai.git
- Reported production URL: https://stickmurai.vercel.app (not checked or deployed during migration).
- Working tree was clean before migration. Migration adds instructions, documentation, and a local skill migration utility; game source was not changed.
- Stack: TypeScript, Vite, Canvas 2D, DOM/CSS overlays, Supabase, PeerJS; Android Kotlin/Compose WebView wrapper.

## Where the game lives

| Area | Files | Responsibilities |
| --- | --- | --- |
| Game orchestration | `src/main.ts` | Startup, callback registration, init/reset, update loop, combat resolution, stage transitions |
| Shared state | `src/globals.ts`, `src/callbacks.ts` | Modes, flow state, timers, statistics, progression and cross-module callback wiring |
| Combat | `src/player.ts`, `src/enemy.ts`, `src/entities.ts` | Player actions, enemy behaviors, projectiles, particles, slashes, shockwaves and other effects |
| Rendering | `src/renderer.ts`, `src/weather.ts` | Canvas drawing, camera-facing presentation and weather |
| UI and controls | `index.html`, `src/ui.ts`, `src/style.css`, `src/input.ts` | Menus, Dojo, HUD, modals, keyboard/touch/gamepad input |
| Progression | `src/powerups.ts`, `src/shrine.ts`, `src/globals.ts` | In-run upgrades, awakenings, shrines, calamities and progression state |
| Assets/audio | `src/assets.ts`, `src/audio.ts`, `public/`, `raw_assets/` | Asset definitions/loading, localization, sprites, local fonts and sound |
| Persistence | `src/storage.ts` | Exception-safe localStorage wrapper for restricted WebViews/private browsing |
| Multiplayer | `src/pvpLobby.ts`, `src/pvpIaijutsuManager.ts` | Supabase anonymous sessions, profiles, friendships, invitations and presence; PeerJS peer connections |
| Database | `supabase/migrations/` | Social tables and subsequent short-ID/social changes |
| Asset pipeline | `scripts/slice_new_assets.py`, `scripts/extract_and_slice_all.py` | Sprite and portrait extraction |
| Android | `android/app/src/main/java/com/lyan/stickmurai/ui/main/MainScreen.kt` | WebView loading bundled assets through WebViewAssetLoader |

Main is a large orchestration module (about 262 KB at handoff); UI and assets are
also substantial. The graph reports import cycles involving callbacks, assets,
player, enemy and entities. Inspect initialization order before moving code.

## Recent completed work recorded in Git

- `f4f43e0`: persisted cache-busting, transparent asset generation and loading rules.
- `6d81491`: 15-second loader timeout, cleaned Samurai/Nightborne/Satyr portraits and cache-busting.
- `0439fb3`: prevented Dojo portrait collapse, reduced shockwave/VFX load and improved culling.
- `06e19e2`: compact action tiles, stage-clear layout and safe-area protection.
- `dbbb121`: roomier modal layouts and a GroundScar runtime crash fix.

The old implementation plan describes some work already committed. Do not reapply
it blindly. The latest walkthrough reports deployment of earlier work; that is
historical evidence, not fresh verification of the live game.

## User preferences and recurring regressions

The recent conversation repeatedly prioritizes mobile startup, hero/slash asset
visibility, avoiding runtime freezes, and readable controls across iPhone,
Android and Windows. The user wants compact square menu actions without hidden
buttons, clean portraits like Shadow Shinobi, and fewer unnecessary shockwaves.
Keep the established font aesthetic using local font files.

Progression requests include increasingly challenging stages, defaulting to the
highest reached stage, currency unlocks and bounded upgrades. Earlier messages
requested reduced hero prices and nerfs to excessive upgrade scaling. Current
source and the latest rules take precedence over old suggested prices or tuning.
Do not carry in-run powerups into the next stage or allow level-up popups after
completion. Preserve normal enemies dying in 1–3 clean hits rather than solving
difficulty through blanket HP inflation.

The complete rules are in `.agents/rules/game_dev_invariants.md`: no per-frame
Canvas filters/shadow blur, capped/deduplicated effects, culling, bounded hot
loops, accurate telegraphs, boss execution caps, protected visual containers,
dual button events, transparent/right-facing/centered sprites, exact slicing,
asset cache-busting, eager core combat assets, local fonts and a dark first paint.

## Verification and local tools

TypeScript checking and the Vite production build passed on 2026-09-05 using:

```powershell
node node_modules/typescript/bin/tsc
node node_modules/vite/bin/vite.js build
```

Run the second command only if type checking succeeds. `npm run build` failed
because the npm shim selected from the roaming profile references a missing
`npm-cli.js`; this is a local launcher issue, not a TypeScript failure. A separate
Node installation exists under `C:/Program Files/nodejs` and can be inspected if
the launcher needs repair. No global Node configuration was changed.

The successful build reported a large JS chunk (~768 KB, ~209 KB gzip) and an
ineffective dynamic import: `pvpLobby.ts` is also imported statically. These are
follow-up opportunities, not a reason to make unrequested structural changes.
No browser, physical-device, multiplayer, APK or live production test was run
during this migration. The build refreshed ignored `dist/` output only.

Android commands are in `package.json`; `build:android` deletes/replaces the
packaged asset directory, and APK scripts invoke Gradle afterward. Validate the
absolute destination before asset replacement. No Android build was run here.

## Knowledge graph

`graphify-out/graph.json` exists. Its initial report contained 427 nodes and 1047
edges from `06e19e2d`, older than starting HEAD. During migration a successful
AST-only refresh rebuilt it to 442 nodes, 1060 edges and 21 communities, backing
up the previous graph automatically. No LLM/API key was needed for this refresh.
`graphify-out/wiki/index.md` does not exist despite its mention in the prior
handoff. The `graphify` launcher was not available on PATH. Its existing Python
installation successfully ran a startup/combat query and the refresh after
execution outside the restricted environment was approved. The interpreter is:
`C:/Users/lyan1/AppData/Local/Python/pythoncore-3.14-64/python.exe`.
Use `& '<interpreter-path>' -m graphify query '<question>'` and
`& '<interpreter-path>' -m graphify update .`. If execution is restricted, request
the required access; if unavailable, inspect JSON/source and record the limit.
The refresh covers code structure, not semantic ingestion of all historical chat.

## Skills and services

The inventory scanned 493 SKILL.md files, deduplicated to 247 names. 127 were
already available; 120 missing skills were copied with their directory contents
and their SKILL.md contents verified. Existing versions were not overwritten.
Some nested skills also remain within their copied parent bundles. See
`antigravity-skill-inventory.json` for sources, destinations and existing-version
differences. New skills should be available on the next turn.

This installs skill instructions and supporting files, not all third-party
executables, MCP servers, dependencies or service sessions they may require.
Antigravity-native skills may refer to tools unavailable in Codex. Load and adapt
applicable skills when needed; do not assume all 247 workflows were runtime-tested.

Service references, without credentials:

- GitHub: existing repository remote; local credential-manager authentication was reported by the old handoff, not tested with a push.
- Vercel: `.vercel/project.json`; prior CLI auth locations under the user's AppData. Authentication was not tested by deploying.
- Supabase: `src/supabaseClient.ts`; local SQL migrations under `supabase/migrations/`. No admin keys copied and no database mutations performed.
- Antigravity MCP configuration: `C:/Users/lyan1/.gemini/config/mcp_config.json`.
- Antigravity OAuth store: `C:/Users/lyan1/.gemini/antigravity/mcp_oauth_tokens.json` (not copied).
- Prior MCP names: 21st-dev Magic, Framelink Figma, Chrome DevTools, Context7, GMP Code Assist, Graphify, Playwright, Postman, Stitch, Supabase and Webclaw.

MCP connections/authentication were not migrated. No matching callable Codex
tools were found for Supabase, Stitch, Figma, Context7, Graphify, Postman or
Webclaw in this session. Setting these up is separate from installing skills.

## Original history

Session directory:
`C:/Users/lyan1/.gemini/antigravity/brain/1da75f2d-80ca-4f69-97f2-f5694588e4b3/`

- `walkthrough.md`: latest Dojo/VFX explanation.
- `learning_proposal.md`: cache-busting, transparency and loading lessons.
- `implementation_plan.md`: earlier UI redesign plan.
- `.system_generated/logs/transcript_full.jsonl`: approximately 30 MB; 131 explicit user-input records. Recent requests were reviewed during migration, not every historical tool-output line.
- `.system_generated/logs/transcript.jsonl`: compact transcript.

Raw transcripts and credentials were not copied into the repository. For older
decisions, retrieve the relevant messages from the original session directory.
