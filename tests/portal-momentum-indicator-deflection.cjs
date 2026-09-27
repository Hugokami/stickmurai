const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mainSrc = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const rendererSrc = fs.readFileSync(path.join(root, 'src/renderer.ts'), 'utf8');
const enemySrc = fs.readFileSync(path.join(root, 'src/enemy.ts'), 'utf8');
const callbacksSrc = fs.readFileSync(path.join(root, 'src/callbacks.ts'), 'utf8');

test('portal momentum ejection pulls player into vortex and bursts on shop exit', () => {
  // Gravitational suction towards vortex
  assert.match(mainSrc, /pullSpeed|pullFactor|vortex/i, 'enterWavePortal must implement gravitational vortex pull');
  // Record portal entry
  assert.match(mainSrc, /lastPortalPos/, 'enterWavePortal must remember portal coordinates for ejection');
  // Shop exit ejection in advanceToNextWave
  assert.match(mainSrc, /advanceToNextWave/, 'advanceToNextWave must handle wave transition');
  assert.match(mainSrc, /globals\.invulnTimer\s*=\s*Math\.max\(globals\.invulnTimer[^,]+,\s*0\.35\)/, 'Player must gain 0.35s intangibility on ejection');
  assert.match(mainSrc, /burstSpeed|dashSpeed/, 'Player must receive +50% move speed boost on ejection');
  assert.match(mainSrc, /Afterimage\.acquire/, 'Ejection burst must spawn phantom dash afterimages');
});

test('indicator corridor includes range notches and lethal kill-threshold glow', () => {
  // Range notches along corridor
  assert.match(rendererSrc, /slashReach|slashSizeMult/, 'Aim corridor must compute slash reach range notch');
  assert.match(rendererSrc, /waveTravel|iaijutsuRangeMult/, 'Aim corridor must compute wave projectile travel notch');
  // Lethal threshold enemy detection
  assert.match(rendererSrc, /isAimTargetLethal/, 'Aim indicator must flag lethal corridor targets');
  // Enemy silhouette turns red
  assert.match(enemySrc, /isAimTargetLethal.*#ef4444|#ef4444.*isAimTargetLethal/s, 'Lethal tagged enemy must tint silhouette red');
});

test('volatile deflection bats detonator backward 600px into clusters before detonation', () => {
  assert.match(callbacksSrc, /tryDeflectDetonator/, 'Callbacks must expose tryDeflectDetonator');
  assert.match(mainSrc, /function tryDeflectDetonator/, 'main.ts must implement tryDeflectDetonator');
  assert.match(mainSrc, /1600/, 'Deflection knockback speed must scale to 600px travel');
  assert.match(mainSrc, /0\.38|0\.375/, 'Deflection duration must govern 600px trajectory');
  assert.match(enemySrc, /deflectedDetonationTimer/, 'Enemy must count down deflected detonation before explosion');
  assert.match(enemySrc, /isDeflected/, 'triggerBarrelExplosion must recognize deflected state');
});
