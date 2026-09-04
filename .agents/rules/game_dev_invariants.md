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
