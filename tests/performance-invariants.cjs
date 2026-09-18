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

  // Check audio BGM play triggers directly with proper load setup
  const audioSrc = fs.readFileSync('src/audio.ts', 'utf8');
  assert.match(audioSrc, /bgmAudio\.play\(\)/, 'audio.ts should attempt bgmAudio.play()');

  // Check canvas clean reset invariant preserved
  assert.match(rendererSrc, /ctx\.globalAlpha = 1;/, 'renderer.ts must retain reset canvas compositing');
  assert.match(rendererSrc, /ctx\.clearRect\(0, 0, globals\.width, globals\.height\);/, 'renderer.ts must clear canvas cleanly');

  // Single-execution & anti-runaway invariant checks
  assert.match(entitiesSrc, /if \(this\.deathHandled && newState !== 'dead'\) return;/, 'entities.ts must lock dead entities from state alteration');
  assert.match(mainSrc, /if \(e\.state === 'dead' \|\| e\.deathHandled\) return;/, 'main.ts must guard killEnemy with deathHandled');
  assert.match(mainSrc, /tickTimer = 0\.25/, 'main.ts plasma trails must use tick timer to prevent per-frame hitEnemy explosion');
  assert.match(mainSrc, /hitTimer = 0\.2/, 'main.ts bouncing sickles must use hit timer to prevent per-frame hitEnemy explosion');

  // UI modal containment & display invariants
  const styleCss = fs.readFileSync('src/style.css', 'utf8');
  assert.doesNotMatch(styleCss, /#skill-select-screen\.overlay\s*\{[^}]*display:\s*flex\s*!important/s, 'skill-select-screen.overlay must never force display: flex !important, which breaks inline display:none and traps the player');
  assert.match(styleCss, /\.overlay\[style\*="display:\s*none"\]/, 'style.css must enforce display: none !important for hidden overlays');

  // Poki SDK integration invariants
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert.match(indexHtml, /poki-sdk\.js/, 'index.html must load the Poki SDK script in <head>');
  assert.match(indexHtml, /Poki SDK: Prevent page scroll/, 'index.html must prevent arrow/space scroll navigation for Poki');

  const adManagerSrc = fs.readFileSync('src/adManager.ts', 'utf8');
  assert.match(adManagerSrc, /gameLoadingFinished\(\)/, 'adManager.ts must implement gameLoadingFinished()');
  assert.match(adManagerSrc, /gameplayStart\(\)/, 'adManager.ts must implement gameplayStart()');
  assert.match(adManagerSrc, /gameplayStop\(\)/, 'adManager.ts must implement gameplayStop()');
  assert.match(adManagerSrc, /commercialBreak/, 'adManager.ts must implement commercialBreak()');
  assert.match(adManagerSrc, /rewardedBreak/, 'adManager.ts must implement rewardedBreak()');
  assert.match(adManagerSrc, /measure\(/, 'adManager.ts must implement measure()');

  const pkgCgSrc = fs.readFileSync('scripts/package-crazygames.cjs', 'utf8');
  assert.match(pkgCgSrc, /poki-sdk/, 'package-crazygames.cjs must strip poki-sdk for CrazyGames compliance');
});
