---
trigger: always_on
---

# Stickmurai — Action Game Development & 60 FPS Performance Invariants

When developing or modifying 2D canvas, web, or action games in this project:

## 1. Pacing & Game Feel Over Stat Bloat
- **Snappy Combat Rhythm**: Preserve instant feedback. Standard grunts must die in 1–3 clean strikes or swift executions. Never inflate baseline mob HP across the board to accommodate new upgrade tiers.
- **Do Not Break Signature VFX/Animation**: Never alter or overwrite established player animations, attack trails, or impact VFX unless explicitly requested. Always keep changes additive or strictly isolated.
- **No Artificial Slow-Motion**: Do not introduce artificial slow-motion or extended hit-stops unless requested; in web action games, players perceive time-dilation as hardware lag and stutter.

## 2. Canvas 2D & Web Engine Performance (Butter-Smooth 60 FPS)
- **Zero `ctx.filter` on 2D Context**: Never apply CSS filter strings (`brightness`, `hue-rotate`, `blur`) directly to `CanvasRenderingContext2D`. It forces browsers into CPU software fallbacks and drops mobile WebViews to <20 FPS. Always use offscreen canvas tint caches (`getTintedImage`).
- **No $O(N^2)$ Loops in Frame Ticks**: Never run nested loops checking all entities against all entities per frame (e.g. AoE echoes or chained hits). Cap max target iterations (e.g. max 5 targets) or use 1D spatial bucketing.
- **Squared Distance Comparisons**: Always compare squared distances ($dx^2 + dy^2 < r^2$). Never call `Math.hypot` or `Math.sqrt` in per-frame collision or proximity sweeps.
- **Integer Coordinate Truncation**: Cast canvas rendering coordinates to integers (`| 0` or `Math.round`) to prevent expensive sub-pixel anti-aliasing interpolation on high-DPI screens.
- **DOM Dirty-Checking**: In HTML/CSS HUD overlays, cache previous values and only update DOM properties/classes when the value changes. Never touch DOM nodes unconditionally every frame.

## 3. Combat Balance & Fairness Invariants
- **Boss Execution Caps**: Executions must never deal uncapped % max HP to bosses. Cap boss execution damage (e.g., max 30% of max HP) and apply a stagger/stun phase instead of an instant one-shot.
- **Ranged Enemy Density & Cadence Cap**: Hard-cap simultaneously active ranged/projectile enemies (e.g., max 3–4 alive at once). Add randomized cadence offsets (+0.1s to 0.4s) to enemy charge times to break synchronized offscreen firing walls.
- **One-Shot Protection ("Ronin's Resolve")**: Players at $\ge 2$ health taking lethal damage must be preserved at 1 health with an emergency invulnerability buffer on a cooldown (e.g., 60s), eliminating cheap deaths.
- **Combo Meter Freezes**: Freeze combo degradation timers during unskippable boss attack windups, weapon clashes (Tsubazeriai), and cinematic cut-ins.
- **Post-Duration Ultimate Cooldowns**: Flow awakenings and ultimate abilities must enforce a cooldown that begins **only after** the ultimate's active duration expires, preventing infinite invulnerability loops.
- **Hitbox-Accurate Telegraphs**: Visual attack indicators (laser lines, corridors, rings) must strictly match the underlying physical hitbox coordinates, width, and charge progress.
- **Instant Stage-Clear State Lock & Popup Suppression**: The frame the final target enemy dies or stage objective clears, immediately set `globals.gameState = 'stageclear'` before triggering cinematics or vacuuming collectibles. In `triggerLevelUp()` and skill upgrade routines, enforce `if (globals.gameState !== 'playing') return;` at entry to block race conditions from delayed EXP or particle collections during cinematics. Force immediate CSS `display = 'none'` on `#level-up-screen` and `#ult-screen` when stage completion begins. Never auto-dump perks or carry in-run powerups into subsequent stages.

## 4. UI Overlay & Mobile Touch Invariants
- **Dual Event Binding (`pointerdown` + `click`)**: All interactive UI buttons in HTML modals must attach both `pointerdown` and `click` listeners with `e.stopPropagation()` to prevent missed taps or ghost-touch delays on mobile.
- **Mandatory Escape Hatch**: Any modal or overlay must have an explicit, unconditional "Leave" / "Back" / "✕" exit button. Never leave a modal without a dismiss path.
- **Strict Element ID Verification**: Whenever adding or modifying modals, verify that element IDs in HTML match JavaScript query selectors identically before deployment.
- **Anti-Stretch Modal Action Buttons**: In responsive landscape CSS rules, never let general `.menu-btn { flex: auto; max-width: none; }` rules bleed into flex-column modal dialogs. All modal footer buttons inside vertical flex containers must enforce `flex: 0 0 auto !important; height: 34px !important; max-height: 36px !important; min-height: 32px !important; width: auto !important; max-width: 200px !important;` or use the `.btn-compact` class with strict constraints.

## 5. Sprite Pipeline & Visual Invariants
- **Body Centroid Anchoring**: When slicing sprite sheets with variable-width frames (e.g., muzzle flashes, tails, laser sweeps), anchor the entity's core body mass at the canvas center `(w/2, h/2)` so the physical hitbox never drifts across animation states.
- **Facing Direction Normalization**: Standardize all sliced sprite frames to face **Right** by default upon extraction to maintain uniform collision/physics logic and avoid fragile per-entity direction inversions.
- **Zero Remainder Division Check**: When slicing sprite sheets, never assume square dimensions `(h x h)` without verifying exact divisibility of the sheet width (`width / expected_frames = frame_width`). If `width % frame_width !== 0`, audit the source asset dimensions directly before extracting frames. Slicing with even an 8px or 16px stride error causes linear drift ("rolling film reel" glitch) where the sprite slowly marches off-center across animation loops.
- **Curated Isolation for Massive VFX Packs**: Never bulk-import massive effect libraries. Select and audit individual effect sequences (dimensions, bounding boxes, transparent clipping) one-by-one before wiring them into the render engine.
- **Alpha-Transparent Portrait Centering**: Never bake solid background colors, dark circle gradients, or canvas boxes directly into portrait assets. Crop tightly around the character's pixel centroid and normalize height to 75–80% of canvas dimensions with transparent background (`RGBA`). All ambient lighting and alcove frames must be applied procedurally in CSS.

## 6. Asset Pipeline & Audio Safety Invariants
- **Eager Startup Asset Queueing for Core Combat VFX**: All player slashes, parry sparks, enemy peril alerts, and signature core combat animations must be flagged with `isPriority = true` and loaded before entering the battlefield. Never defer player slashes or hero animations to lazy in-game loading, which causes invisible swings or late pops.
- **Web Audio Exponential Ramp Positive Clamping**: Never pass `0` or negative values to `AudioParam.exponentialRampToValueAtTime()` or `AudioParam.setValueAtTime()`. The Web Audio API spec strictly mandates positive non-zero values for exponential ramps and throws a fatal DOMException or drops the audio context when 0 is supplied. Always clamp gain values with `Math.max(0.001, targetValue)`.

