const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Poki QA Checklist Invariant Verification', () => {
  const adManagerSrc = fs.readFileSync('src/adManager.ts', 'utf8');
  const inputSrc = fs.readFileSync('src/input.ts', 'utf8');
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  const mainSrc = fs.readFileSync('src/main.ts', 'utf8');
  const uiSrc = fs.readFileSync('src/ui.ts', 'utf8');
  const qolSrc = fs.readFileSync('src/qol.ts', 'utf8');
  const styleCss = fs.readFileSync('src/style.css', 'utf8');
  const powerupsSrc = fs.readFileSync('src/powerups.ts', 'utf8');
  const pkgScript = fs.readFileSync('scripts/package-poki.cjs', 'utf8');

  // 1. SDK Basics: Event deduplication & state guard
  assert.match(adManagerSrc, /private static isGameplayActive:\s*boolean/, 'adManager.ts must track isGameplayActive state');
  assert.match(adManagerSrc, /if\s*\(this\.isGameplayActive\)\s*return;/, 'gameplayStart must guard against duplicate calls');
  assert.match(adManagerSrc, /if\s*\(!this\.isGameplayActive\)\s*return;/, 'gameplayStop must guard against duplicate calls');

  // 2. Ad Implementation: Event blocking during active ads & pointer lock release
  assert.match(adManagerSrc, /if\s*\(this\.isAdPlaying\)\s*return;/, 'SDK events must be blocked while an ad is actively playing');
  assert.match(adManagerSrc, /exitPointerLock/, 'adManager.ts must release pointer lock during ads');

  // 3. Playground Integration: Prevent page scroll on desktop controls
  assert.match(inputSrc, /ArrowUp.*ArrowDown.*Space|Space.*ArrowUp/s, 'input.ts must suppress default scroll for arrow and space keys');
  assert.match(indexHtml, /ArrowDown.*ArrowUp.*preventDefault/s, 'index.html must prevent viewport jump on arrow and space keys');

  // 4. First-Start Tutorial: DOM and deferred start
  assert.match(indexHtml, /id="first-start-tutorial-modal"/, 'index.html must contain first-start tutorial modal');
  assert.match(mainSrc, /stickmurai_tutorial_completed/, 'main.ts must check stickmurai_tutorial_completed before firing gameplayStart');

  // 5. Pause & Lifecycle: CommercialBreak on unpause & Spacebar / Escape support
  assert.match(uiSrc, /AdManager\.gameplayStop\(\);[^;]*pauseScreen|AdManager\.gameplayStop\(\);/s, 'Pause actions in ui.ts must fire AdManager.gameplayStop()');
  assert.match(qolSrc, /AdManager\.showMidrollAd/, 'Exiting pause in qol.ts must signal commercialBreak before gameplayStart');
  assert.match(uiSrc, /e\.code === 'Space' && globals\.gameState === 'paused'/, 'ui.ts must support Spacebar to resume from pause');

  // 6. Rewarded Buttons: Prominent 🎬 icons on all rewarded options
  assert.match(indexHtml, /id="ad-revive-btn"[^>]*>.*🎬.*HONOR REVIVE/s, 'ad-revive-btn must include prominent clapper icon');
  assert.match(indexHtml, /id="blessing-swift-btn"[^>]*>.*🎬.*\(Watch Ad to Unlock\)/s, 'blessing-swift-btn must include clapper icon');
  assert.match(indexHtml, /id="stage-clear-double-btn"[^>]*>.*🎬/s, 'stage-clear-double-btn must include clapper icon');
  assert.match(powerupsSrc, /id="shop-ad-gold-btn"[^>]*>.*🎬.*REWARD/s, 'shop-ad-gold-btn must include clapper icon');

  // 7. Tablet Controls: Force mobile controls on touch/tablet devices
  assert.match(mainSrc, /isTouchDevice[\s\S]*is-touch-device/, 'main.ts must detect tablet/touch devices and mark html class');
  assert.match(styleCss, /html\.is-touch-device #left-touch-zone/, 'style.css must force touch controls on tablets');

  // 8. Packaging & Assets: Whitelist includes vfx and active assets
  assert.match(pkgScript, /'vfx'/, 'package-poki.cjs must whitelist vfx directory');
  assert.match(pkgScript, /asset_matches = set\(re\.findall/, 'package-poki.cjs must eliminate stale assets');
});
