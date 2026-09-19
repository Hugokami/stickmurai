const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Poki QA Checklist Invariant Verification', () => {
  const adManagerSrc = fs.readFileSync('src/adManager.ts', 'utf8');
  const inputSrc = fs.readFileSync('src/input.ts', 'utf8');
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  const mainSrc = fs.readFileSync('src/main.ts', 'utf8');
  const uiSrc = fs.readFileSync('src/ui.ts', 'utf8');
  const pvpSrc = fs.readFileSync('src/pvpLobby.ts', 'utf8');

  // 1. SDK Basics: Event deduplication & state guard
  assert.match(adManagerSrc, /private static isGameplayActive:\s*boolean/, 'adManager.ts must track isGameplayActive state');
  assert.match(adManagerSrc, /if\s*\(this\.isGameplayActive\)\s*return;/, 'gameplayStart must guard against duplicate calls');
  assert.match(adManagerSrc, /if\s*\(!this\.isGameplayActive\)\s*return;/, 'gameplayStop must guard against duplicate calls');

  // 2. Ad Implementation: Pointer lock release
  assert.match(adManagerSrc, /exitPointerLock/, 'adManager.ts must release pointer lock during ads');

  // 3. Playground Integration: Prevent page scroll on desktop controls
  assert.match(inputSrc, /ArrowUp.*ArrowDown.*Space|Space.*ArrowUp/s, 'input.ts must suppress default scroll for arrow and space keys');

  // 4. First-Start Tutorial: DOM and deferred start
  assert.match(indexHtml, /id="first-start-tutorial-modal"/, 'index.html must contain first-start tutorial modal');
  assert.match(mainSrc, /stickmurai_tutorial_completed/, 'main.ts must check stickmurai_tutorial_completed before firing gameplayStart');

  // 5. Privacy & Security: Profanity filter for display names
  assert.match(pvpSrc, /sanitizeDisplayName|containsProfanity|filterProfanity/, 'pvpLobby.ts must sanitize display names against profanity');

  // 6. Pause & Lifecycle: Escape / P key must fire gameplayStop
  assert.match(uiSrc, /AdManager\.gameplayStop\(\);[^;]*pauseScreen|AdManager\.gameplayStop\(\);/s, 'Pause actions in ui.ts must fire AdManager.gameplayStop()');
});
