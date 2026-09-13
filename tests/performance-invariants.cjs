const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('performance optimization invariant tests', () => {
  const rendererSrc = fs.readFileSync('src/renderer.ts', 'utf8');
  const mainSrc = fs.readFileSync('src/main.ts', 'utf8');
  const entitiesSrc = fs.readFileSync('src/entities.ts', 'utf8');

  // Check frame-time governor clamping
  assert.match(mainSrc, /Math\.min\(.*0\.05\b/, 'main.ts should govern dt to max 0.05s to prevent large frame skips');

  // Check particle pooling and budget caps
  assert.match(entitiesSrc, /const maxParticles =/, 'entities.ts should define responsive particle caps');

  // Check squared distance optimization in high frequency loops
  assert.match(mainSrc, /< 350 \* 350/, 'main.ts chain lightning should use squared distance check');

  // Check speedlines static precalculated variation instead of Math.random() in draw loop
  assert.doesNotMatch(rendererSrc, /const angle = \(i \/ 40\) \* Math\.PI \* 2 \+ Math\.random\(\)/, 'renderer.ts speedlines should not call Math.random() inside per-frame draw loop');

  // Check UI throttle implementation exists
  const uiSrc = fs.readFileSync('src/ui.ts', 'utf8');
  assert.match(uiSrc, /lastUiUpdateTime/, 'ui.ts should throttle high-frequency DOM HUD updates');

  // Check audio BGM play does not set bgmStarted = true synchronously on unverified play
  const audioSrc = fs.readFileSync('src/audio.ts', 'utf8');
  assert.match(audioSrc, /playPromise\s*\.then/, 'audio.ts should only set bgmStarted upon resolved play promise');

  // Check canvas clean reset invariant preserved
  assert.match(rendererSrc, /ctx\.globalAlpha = 1;/, 'renderer.ts must retain reset canvas compositing');
  assert.match(rendererSrc, /ctx\.clearRect\(0, 0, globals\.width, globals\.height\);/, 'renderer.ts must clear canvas cleanly');
});
