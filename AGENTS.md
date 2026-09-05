# Stickmurai project instructions

Read `docs/CODEX_HANDOFF.md` when joining this project. Before game changes, read
`.agents/rules/game_dev_invariants.md` and `.agents/rules/graphify.md`; these are
the existing project rules migrated from Antigravity, not optional suggestions.

## Product priorities

- Preserve snappy combat and signature player animations, slashes, and impact effects.
- Prioritize reliable startup and sustained 60 FPS on iPhone, Android WebView, and Windows.
- Keep hero portraits visible, transparent, centered, and protected from flex compression.
- Make all modal actions readable, reachable, dismissible, and safe around device cutouts.
- Preserve stage progression while resetting in-run powerups between stages. Stop upgrade popups immediately on stage clear.
- Retain self-hosted fonts and the minimum 15-second startup watchdog. A timeout is a fallback, not proof that assets finished loading.
- Do not infer unfinished implementation work from old proposals; compare with current source and recent commits first.

## Working and verification

- Use Graphify for architecture exploration when available; verify its findings against source because its saved graph may be stale. The wiki cited in the old handoff was absent on migration.
- Run TypeScript checking and the Vite production build for game code changes. Commands and a launcher workaround are in `docs/CODEX_HANDOFF.md`.
- Build success does not establish mobile performance, visual correctness, multiplayer connectivity, or production availability. Test those when relevant to the change.
- Do not run the Android asset-sync script casually: it deletes and replaces the packaged assets. Resolve and check its target directory first.
- Keep credentials and raw transcripts out of repository documentation. Service configuration locations are recorded in the handoff without tokens.
- Skill installation and old transcript deployment claims do not establish that Codex service connections are authenticated or that a new deployment happened.

## Skill migration

`docs/antigravity-skill-inventory.json` records 247 unique source skill names:
127 already available and 120 installed into the user's Codex skill folder.
Existing Codex versions were preserved, including versions that differ from
Antigravity. Read applicable skills on demand; installation is not execution of
their workflows. Antigravity-specific tools and plugin services may require
adaptation or separate authentication before a copied skill can run.
