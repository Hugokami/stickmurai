# Implementation Plan: Audio Startup, PC Scrolling, Atherion Mobile Combos, Mikiri Cooldown, Elixir Price, and Level Scaling

**Target Date/Time**: 2026-09-19_115632  
**Plan Path**: `.hermes/plans/2026-09-19_115632-audio-scroll-combos-mikiri-elixir-leveling.md`

---

## 1. Goal
Fix immediate BGM start on Vercel, restore PC mouse wheel scrolling inside menus/modals, streamline Atherion's mobile combos, add a 1.8s internal cooldown to Mikiri Stride, increase Slash Elixir shop cost to 50 currency, and scale player slash damage with stage level progression.

---

## 2. Current Context & Assumptions
1. **BGM on Vercel**: `src/audio.ts` contains an anti-pattern: if `startBgm()` fails early due to browser autoplay policy, it executes `bgmAudio.muted = true; bgmAudio.play()`. On modern Chromium/WebKit, playing muted advances audio silently. When a player interacts, setting `bgmAudio.muted = false` without re-issuing `play()` in the user gesture leaves playback muted or broken. Furthermore, `startBgm()` returns early if `!bgmAudio.paused`.
2. **PC Mouse Wheel Scrolling**: In `index.html` line 37, `window.addEventListener('wheel', function(ev) { ev.preventDefault(); }, { passive: false });` unconditionally cancels all mouse wheel events across the entire page. On mobile, touch events (`touchmove`) bypass this, but on PC, inner scrolling of `#shop-grid`, `#shop-items-grid`, `.skill-select-grid`, `.stage-select-grid`, `#hero-selection`, and `#settings-modal` is completely blocked.
3. **Atherion Mobile Combos**: Mobile HUD displays 4 separate action buttons (`btn-attack`, `btn-dash`, `btn-enhance`, and `btn-stance-switch` for shoot). Combo windows are tuned to an impractical 260ms–320ms (`lastSlashDelta < 260`, `nowSlash - aetherionLastDashTime < 260`, and Phase Warp requiring Slash + Shoot + Dash all within 320ms). This forces rapid finger gymnastics with a single thumb.
4. **Counter-Flash / Mikiri Stride**: In `src/main.ts` line 5515, when an enemy enters charge/attack state within range, any attack press triggers Mikiri Stride with zero internal cooldown. Bosses constantly telegraph attacks, letting players spam Mikiri Stride consecutively on every slash.
5. **Slash Elixir Price**: `src/powerups.ts` hardcodes the Slash Elixir (+5% DMG) cost at 20 stage gold in both the button markup (`line 973, 983`) and the purchase handler (`line 1205: buyOnePotion`).
6. **Level Up Scaling**: `globals.level` starts at 1. `getCurrentSlashDamage()` in `src/main.ts` does not include `globals.level` in its formula at all, and `applyStatLevelUp()` in `src/powerups.ts` gives a minor flat +5% slash bonus. Stage leveling feels inconsequential in later stages.

---

## 3. Architecture & Proposed Approach
- **Audio Autoplay & Unlock**: Remove muted background playback in `src/audio.ts`. Attempt unmuted playback eagerly; if blocked, bind high-priority, multi-event user interaction listeners (`pointerdown`, `mousedown`, `keydown`, `touchstart`, `click`) that immediately un-mute, reset position if needed, and call `bgmAudio.play()`. Attach early listeners on the loader screen so any initial click starts audio without delay.
- **Selective Wheel Scrolling**: Refactor `wheel` handler in `index.html` to traverse `ev.target` ancestors. If any ancestor is scrollable (`(overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight`), allow default scrolling; otherwise prevent default to satisfy platform requirements.
- **Atherion Mobile Usability**:
  1. Extend combo buffer windows from 260ms/320ms to 650ms.
  2. Implement an auto-weave sequence for Atherion: on mobile/touch, the 3rd consecutive attack tap automatically triggers Astral Beam / Celestial Crossfire without requiring the separate shoot button.
  3. Simplify Astral Phase Warp: triggerable by Dash within 650ms of Slash OR Shoot, avoiding the 3-button requirement.
  4. Lower Starlight Dimension Rend charge threshold from 0.35s to 0.20s.
- **Mikiri Stride Cooldown**: Introduce `globals.lastMikiriStrideTime = 0`. Require `performance.now() - globals.lastMikiriStrideTime >= 1800` (1.8s internal cooldown) before Mikiri Stride triggers. If on cooldown, attacks gracefully perform standard slashes.
- **Economy & Progression Tuning**: Change Slash Elixir cost check and deduction to 50 stage gold in `src/powerups.ts`. In `src/main.ts`, update `getCurrentSlashDamage()` to include `Math.max(0, (globals.level - 1)) * 0.10` (+10% slash damage scaling per stage level) and buff guaranteed level-up bonus in `applyStatLevelUp()`.

---

## 4. Step-by-Step Tasks

### Task 1: Fix PC Mouse Wheel Inner Scrolling in `index.html`
- **File**: `index.html`
- **Action**: Update line 37 to check for scrollable containers before calling `ev.preventDefault()`.
- **Code to Apply**:
```html
  // Poki SDK: Prevent page scroll on game controls while allowing inner modal scrolling
  window.addEventListener('wheel', function(ev) {
    var target = ev.target;
    while (target && target !== document.body && target !== document.documentElement) {
      var style = window.getComputedStyle(target);
      var overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
        return; // Allow scrolling inside scrollable containers (shop, skill select, settings, etc.)
      }
      target = target.parentElement;
    }
    ev.preventDefault();
  }, { passive: false });
```
- **Verification Command**:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('overflowY === \'auto\' || overflowY === \'scroll\'')) throw new Error('Wheel handler not updated');
console.log('Task 1 verified');
"
```

---

### Task 2: Immediate BGM Startup & Clean Unlock in `src/audio.ts` & `src/main.ts`
- **Files**: `src/audio.ts`, `src/main.ts`
- **Action**:
  1. Remove the muted autoplay fallback (`bgmAudio.muted = true; bgmAudio.play()`) in `initImmediateAudio()`.
  2. In `startBgm()`: ensure that if `bgmAudio.paused` is true, it sets proper volume, ensures `bgmAudio.muted = false`, and attempts `bgmAudio.play()`.
  3. In `initImmediateAudio()`: attach eager unlock listeners on `window` and `document` capturing `pointerdown`, `touchstart`, `mousedown`, `keydown`, `click`. On first gesture:
     - Set `bgmAudio.muted = false`.
     - Resume `AudioContext`.
     - Invoke `startBgm()`.
  4. In `src/main.ts`: Ensure early skip on `#loader-screen` also immediately invokes unmuted `startBgm()`.
- **Exact Changes in `src/audio.ts`**:
```typescript
export function startBgm() {
  if (isPortalMuted) {
    if (bgmAudio) {
      bgmAudio.muted = true;
      bgmAudio.pause();
    }
    bgmStarted = false;
    return;
  }
  
  bgmAudio.muted = false;
  const bgmVolumeSlider = typeof document !== 'undefined' ? document.getElementById('bgm-volume') as HTMLInputElement : null;
  if (bgmVolumeSlider) {
    bgmAudio.volume = parseFloat(bgmVolumeSlider.value);
  } else {
    bgmAudio.volume = 0.5;
  }

  if (bgmStarted && !bgmAudio.paused) return;
  bgmStarted = true;

  try {
    bgmAudio.loop = playlist.length <= 1;
    if (!bgmAudio.src) {
      bgmAudio.src = playlist[currentBgmIndex];
    }
    if (bgmAudio.readyState === 0) {
      bgmAudio.load();
    }
  } catch (e) {
    console.warn('Failed BGM load call:', e);
  }
  const playPromise = bgmAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Browser autoplay policy prevented playback before interaction
      bgmStarted = false;
    });
  }
}

export function initImmediateAudio() {
  if (typeof window === 'undefined') return;

  // Immediate eager attempt with sound
  try {
    startBgm();
  } catch (_) {}

  // Instant unlock listeners on any early gesture anywhere on screen
  const unlockEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];
  const unlockHandler = () => {
    resumeAudioContext();
    bgmAudio.muted = false;
    startBgm();
    setTimeout(() => {
      if (!bgmAudio.paused) {
        unlockEvents.forEach(evt => {
          window.removeEventListener(evt, unlockHandler, true);
          document.removeEventListener(evt, unlockHandler, true);
        });
      }
    }, 150);
  };

  unlockEvents.forEach(evt => {
    window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
    document.addEventListener(evt, unlockHandler, { capture: true, passive: true });
  });
}
```
- **Verification Command**:
```bash
node -e "
const fs = require('fs');
const code = fs.readFileSync('src/audio.ts', 'utf8');
if (code.includes('attempt muted play to prime audio pipeline')) throw new Error('Muted audio hack still present');
console.log('Task 2 verified');
"
```

---

### Task 3: Internal Cooldown (1.8s) for Counter-Flash / Mikiri Stride
- **Files**: `src/globals.ts`, `src/main.ts`
- **Action**:
  1. In `src/globals.ts`: add `lastMikiriStrideTime: 0` to `globals`.
  2. In `src/main.ts` line 5515: check `const now = performance.now();` and require `now - (globals.lastMikiriStrideTime || 0) >= 1800`.
  3. When Mikiri Stride triggers, record `globals.lastMikiriStrideTime = now;`.
- **Exact Changes in `src/globals.ts`**:
```typescript
  // Under combat tracking:
  lastMikiriStrideTime: 0,
```
- **Exact Changes in `src/main.ts`**:
```typescript
  // Option 2: Counter-Flash / Mikiri Stride (Ronin / Sekiro style)
  // Internal cooldown of 1.8s to prevent unlimited spam against bosses
  const nowMikiri = performance.now();
  const mikiriReady = (nowMikiri - (globals.lastMikiriStrideTime || 0)) >= 1800;
  if (!dashAttackTriggered && isAttackPressed && globals.player.state !== 'dash' && globals.player.state !== 'dead' && mikiriReady) {
    for (let i = 0; i < globals.enemies.length; i++) {
      const e = globals.enemies[i];
      if (e.state === 'dead') continue;
      const isImminentAttack = (e.state === 'charge' && e.stateTime >= e.chargeTimeMax - (0.32 * parryWindowMult)) ||
                               (e.state === 'attack' && e.stateTime <= 0.18 * parryWindowMult);
      if (isImminentAttack) {
        const dx = e.x - globals.player.x;
        const dy = e.y - globals.player.y;
        const distSq = dx * dx + dy * dy;
        const maxDist = 240 + (e.scaleMult - 1) * 60;
        if (distSq < maxDist * maxDist) {
          globals.lastMikiriStrideTime = nowMikiri;
          parryTriggered = true;
          // ... remaining Mikiri Stride execution ...
```
- **Verification Command**:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('src/main.ts', 'utf8');
if (!src.includes('lastMikiriStrideTime') || !src.includes('1800')) throw new Error('Mikiri cooldown missing');
console.log('Task 3 verified');
"
```

---

### Task 4: Increase Slash Elixir Price to 50 Currency in `src/powerups.ts`
- **File**: `src/powerups.ts`
- **Action**: Update price from 20 to 50 in the shop button markup, disabled condition, affordability styling, and `buyOnePotion` purchase function.
- **Exact Changes in `src/powerups.ts`**:
```typescript
// Line ~977:
<button id="shop-potion-btn" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.5); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; font-family: 'Outfit', sans-serif; box-sizing: border-box; text-decoration: none;" ${(globals.stageCurrency || 0) < 50 ? 'disabled' : ''}>
  <div style="display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 700; color: #fbbf24;">
    <img src="icons/potion_attack.png" class="inline-currency-icon" style="width: 18px; height: 18px;" alt="Slash Elixir" />
    <span>Slash Elixir (+5% DMG)</span>
  </div>
  <div style="font-family: 'Orbitron', monospace; font-size: 10.5px; font-weight: bold; color: ${(globals.stageCurrency || 0) >= 50 ? '#ffd700' : '#ef4444'}; background: rgba(0,0,0,0.55); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.4); white-space: nowrap; display: flex; align-items: center; gap: 3px;">
    <img src="icons/stage_gold.png" class="inline-currency-icon" style="width: 13px; height: 13px;" /> 50
  </div>
</button>

// Line ~1205 (buyOnePotion):
const buyOnePotion = (): boolean => {
  if ((globals.stageCurrency || 0) < 50) return false;
  globals.stageCurrency -= 50;
  globals.stageAttackPotions = (globals.stageAttackPotions || 0) + 1;
  callbacks.updateUI();
  playSound(sfx.magatamaPickup, 1.0);
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "+5% SLASH DMG (STAGE)! ⚔️", "#fbbf24", 26));
  renderShopModal();
  return (globals.stageCurrency || 0) >= 50;
};
```
- **Verification Command**:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('src/powerups.ts', 'utf8');
if (!src.includes('(globals.stageCurrency || 0) < 50') || !src.includes('globals.stageCurrency -= 50')) {
  throw new Error('Slash elixir price not updated to 50');
}
console.log('Task 4 verified');
"
```

---

### Task 5: Scale Stage Leveling with Slash Damage %
- **Files**: `src/main.ts`, `src/powerups.ts`
- **Action**:
  1. In `src/main.ts` `getCurrentSlashDamage()`: scale slash damage directly with stage levels:
     `const stageLevelPct = Math.max(0, (globals.level - 1)) * 0.10;` (+10% per level).
     `const slashPct = 1.0 + (globals.playerStats?.slashBonusDmgPct || 0) + slashPotionPct + stageLevelPct;`
  2. In `src/powerups.ts` `applyStatLevelUp()`: buff the base guaranteed slash bonus from `0.05` to `0.08 + Math.min(0.12, globals.level * 0.01)`.
  3. In `src/powerups.ts` `triggerLevelUp()`: emphasize the slash damage increase in the level-up floating text:
     `globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, `⚔️ LEVEL ${globals.level}! (+${Math.round((globals.level - 1) * 10)}% DMG)`, '#ffd700', 36));`
- **Exact Changes in `src/main.ts`**:
```typescript
export function getCurrentSlashDamage(): number {
  const baseDmg = 1.0 + (globals.playerStats?.slashFlatDmg || 0) + (globals.playerStats?.reapersMarkLevel || 0) * 2 + (globals.flowState === 'awakened' ? 2.5 : 0) + (globals.playerStats?.enhanceBonusDmg || 0);
  const slashPotionPct = (globals.stageAttackPotions || 0) * 0.05;
  const stageLevelPct = Math.max(0, (globals.level - 1)) * 0.10;
  const slashPct = 1.0 + (globals.playerStats?.slashBonusDmgPct || 0) + slashPotionPct + stageLevelPct;
  const comboMult = 1.0 + Math.min(1.5, (globals.combo || 0) * 0.015);
  const ultMult = globals.flowState === 'awakened' ? (1 + (globals.playerStats?.ultimateDamageBonusPct || 0)) : 1.0;
  return Math.max(1, baseDmg * slashPct * comboMult * ultMult);
}
```
- **Verification Command**:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('src/main.ts', 'utf8');
if (!src.includes('stageLevelPct = Math.max(0, (globals.level - 1)) * 0.10')) {
  throw new Error('Level scaling missing from getCurrentSlashDamage');
}
console.log('Task 5 verified');
"
```

---

### Task 6: Streamline Atherion's Mobile Combos
- **Files**: `src/main.ts`, `src/player.ts`, `src/globals.ts`
- **Action**:
  1. **Expand combo timing windows**:
     - In `src/main.ts` `triggerAetherionRangedAttack`: increase `lastSlashDelta` window for Celestial Crossfire from 260ms to 650ms.
     - In `src/main.ts` line 6024: increase Celestial Stride Cleave dash-to-slash window from 260ms to 650ms.
     - In `src/player.ts`: increase Astral Phase Warp window from 320ms to 650ms, and allow triggering if either Slash OR Shoot occurred within 650ms of Dash.
     - In `src/player.ts`: lower Starlight Dimension Rend charge threshold from 0.35s to 0.20s.
  2. **Mobile 3-Hit Auto-Weave**:
     - Track `globals.aetherionComboHits = 0`.
     - In `src/main.ts` melee attack execution: if `globals.selectedHero === 'aetherion'` and (is mobile/touch or on 3rd hit):
       Every 3rd attack in a chain automatically triggers `triggerAetherionRangedAttack()` / Celestial Crossfire! This allows mobile players to execute Atherion's signature ranged blast naturally through basic combat flow without mashing extra buttons.
- **Verification Command**:
```bash
node -e "
const fs = require('fs');
const main = fs.readFileSync('src/main.ts', 'utf8');
const player = fs.readFileSync('src/player.ts', 'utf8');
if (!main.includes('650') || !player.includes('650')) throw new Error('Atherion combo timing windows not expanded to 650ms');
console.log('Task 6 verified');
"
```

---

### Task 7: Automated Unit & Invariant Tests
- **File**: `tests/balance-and-controls.cjs`
- **Action**: Create a new test suite verifying:
  1. `getCurrentSlashDamage` scales with `globals.level`.
  2. Slash Elixir costs 50 and deducts 50.
  3. Mikiri Stride respects 1.8s internal cooldown.
  4. Atherion combo windows accept >= 600ms deltas.
  5. Poki SDK mouse wheel listener in `index.html` permits inner element scrolling.
- **Verification Command**:
```bash
node --test tests/balance-and-controls.cjs tests/balance.cjs tests/progression-qol.cjs tests/performance-invariants.cjs
```
- **Expected Output**: All test suites pass with 0 failures.

---

### Task 8: Production Build & Verification
- **Action**:
  1. Run `npm run build` to verify TypeScript compile and Vite bundling succeed with 0 errors.
  2. Run `npm run package:poki` to package the Poki build.
- **Command**:
```bash
npm run build && node scripts/package-poki.cjs --no-build
```

---

## 5. Risks, Tradeoffs, and Open Questions
- **Browser Autoplay Policy**: Browsers strictly forbid unmuted audio on completely cold origins prior to any interaction. By removing the silent muted playback bug and binding universal early unlock handlers, audio starts on the first interaction (even touching the loading screen) without remaining muted.
- **Boss Encounter Balance**: Throttling Mikiri Stride to a 1.8s cooldown prevents players from stunlocking bosses with infinite invulnerability frames, while still rewarding timed counters. Standard slashes continue uninterrupted during the cooldown.
- **Level Scaling Balance**: A +10% slash damage scaling per stage level provides tangible reward for exp collection in multi-wave stages without trivializing early game.

---
*Plan created in `.hermes/plans/2026-09-19_115632-audio-scroll-combos-mikiri-elixir-leveling.md`.*
