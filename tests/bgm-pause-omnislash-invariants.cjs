const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('BGM Startup & Gesture Unlock Invariants', () => {
  const audioTs = fs.readFileSync(path.join(__dirname, '../src/audio.ts'), 'utf8');
  const mainTs = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
  const uiTs = fs.readFileSync(path.join(__dirname, '../src/ui.ts'), 'utf8');

  // Verify triggerBgmGestureUnlock export
  assert.match(
    audioTs,
    /export function triggerBgmGestureUnlock\(\)/,
    'src/audio.ts must export triggerBgmGestureUnlock'
  );

  // Verify initImmediateAudio attaches unlock listeners to both window and document
  assert.match(
    audioTs,
    /window\.addEventListener\(evt,\s*unlockHandler/,
    'initImmediateAudio must listen to window events'
  );
  assert.match(
    audioTs,
    /document\.addEventListener\(evt,\s*unlockHandler/,
    'initImmediateAudio must listen to document events'
  );

  // Verify loaderScreen interaction triggers audio unlock
  assert.match(
    mainTs,
    /triggerBgmGestureUnlock\(\);/,
    'main.ts loader screen continue / early skip must call triggerBgmGestureUnlock'
  );

  // Verify UI buttons call triggerBgmGestureUnlock on click/pointerdown
  assert.match(
    uiTs,
    /triggerBgmGestureUnlock\(\);/,
    'ui.ts bindDualListener must trigger BGM unlock on user gestures'
  );
});

test('In-Game Pause & Shop Buttons Invariants', () => {
  const styleCss = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf8');
  const uiTs = fs.readFileSync(path.join(__dirname, '../src/ui.ts'), 'utf8');
  const powerupsTs = fs.readFileSync(path.join(__dirname, '../src/powerups.ts'), 'utf8');

  // Verify mobile-controls container never swallows pointer events
  assert.doesNotMatch(
    styleCss,
    /html\.is-touch-device #mobile-controls\s*\{[^}]*pointer-events:\s*auto\s*!important/s,
    'mobile-controls must NOT have pointer-events: auto !important as container'
  );

  // Verify ui-layer is placed above mobile controls
  assert.match(
    styleCss,
    /#ui-layer\s*\{[^}]*z-index:\s*60;/s,
    'ui-layer must have z-index: 60 to sit above mobile-controls'
  );

  // Verify pause button has pointer-events: auto and elevated z-index
  assert.match(
    styleCss,
    /#pause-btn,\s*\.hud-pause-btn\s*\{[^}]*pointer-events:\s*auto\s*!important;[^}]*z-index:\s*70;/s,
    'pause button must have pointer-events: auto !important and z-index: 70'
  );

  // Verify shop button has pointer-events: auto and elevated z-index
  assert.match(
    styleCss,
    /\.hud-shop-btn\s*\{[^}]*pointer-events:\s*auto\s*!important;[^}]*z-index:\s*70;/s,
    'shop button must have pointer-events: auto !important and z-index: 70'
  );

  // Verify pause button toggles resume when already paused
  assert.match(
    uiTs,
    /else if \(globals\.gameState === 'paused'\)\s*\{\s*requestResume\(\);/,
    'pause button must resume when gameState is paused'
  );

  // Verify openShop toggles close when shop is open
  assert.match(
    powerupsTs,
    /if \(globals\.shopOpen\)\s*\{\s*closeShop\(\);\s*return;\s*\}/,
    'openShop must toggle close if shop is already open'
  );
});

test('Omnislash Scaling & Early Stage Boss HP Bar Invariants', () => {
  const powerupsTs = fs.readFileSync(path.join(__dirname, '../src/powerups.ts'), 'utf8');
  const enemyTs = fs.readFileSync(path.join(__dirname, '../src/enemy.ts'), 'utf8');

  // Verify Omnislash incorporates enemy maxHp (30% boss, 30-40% mob)
  assert.match(
    powerupsTs,
    /const hpChunk = typeof e\.maxHp === 'number' && e\.maxHp > 0 \? Math\.round\(e\.maxHp \* \(isBoss \? 0\.30 : \(0\.30 \+ Math\.random\(\) \* 0\.10\)\)\) : 0;/,
    'Omnislash hit damage must add 30% of boss max HP and 30-40% of mob max HP'
  );

  assert.match(
    powerupsTs,
    /const hpChunk = typeof enemy\.maxHp === 'number' && enemy\.maxHp > 0 \? Math\.round\(enemy\.maxHp \* \(isBoss \? 0\.30 : \(0\.30 \+ Math\.random\(\) \* 0\.10\)\)\) : 0;/,
    'Omnislash final blast must add 30% of boss max HP and 30-40% of mob max HP'
  );

  // Verify early stage bosses (stage <= 5) have exactly 1 HP bar
  assert.match(
    enemyTs,
    /this\.totalPhases\s*=\s*stage <= 5 \? 1 : \(stage < 10 \? 2 : 3\);/,
    'Early stage bosses (stage <= 5) must have totalPhases = 1'
  );
});
