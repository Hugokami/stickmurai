const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src/renderer.ts'), 'utf8');
const powerups = fs.readFileSync(path.join(root, 'src/powerups.ts'), 'utf8');

test('portal clear removes stragglers and projectiles without kill credit; waits for touch', () => {
  assert.match(main, /function clearWaveToPortal\(/);
  assert.match(main, /stopSpawner\(\);\s*globals\.enemies\.length = 0;\s*globals\.projectiles\.length = 0;/);
  assert.match(main, /globals\.waveState = 'cleared';/);
  assert.match(main, /globals\.wavePortal = \{ x:/);
  assert.match(main, /function enterWavePortal\(/);
  assert.match(main, /globals\.player\.x = 700;\s*globals\.player\.y = 350;/);
  assert.match(main, /globals\.waveState = 'shop';\s*refreshShop\(true\);\s*openShop\(\);/);
  assert.doesNotMatch(main, /globals\.waveState === 'shop' && !globals\.shopOpen/);
  assert.match(powerups, /if \(globals\.waveState === 'shop'\) \{\s*globals\.waveState = 'active';\s*callbacks\.advanceToNextWave\(\)/);
});

test('portal sprite renders in world space, away from initial player location', () => {
  assert.match(renderer, /portalImage\.naturalWidth === 192/);
  assert.match(renderer, /ctx\.drawImage\(portalImage, frame % 3 \* 64, Math\.floor\(frame \/ 3\) \* 64, 64, 64/);
  assert.match(main, /globals\.wavePortal = \{ x: portalX, y: globals\.player\.y \}/);
  assert.ok(fs.existsSync(path.join(root, 'public/fantasy_bg/wave-portal.png')));
});
