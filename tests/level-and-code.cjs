const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { stripTypeScriptTypes } = require('node:module');

function functionSource(file, start, end) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');
  return stripTypeScriptTypes(source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))).replace(/^export /, '');
}
test('every level adds one max heart and one current heart, including multi-level XP', () => {
  const globals = { gameState: 'playing', exp: 220, maxExp: 100, level: 1, maxLives: 5, lives: 3, gameMode: 'classic', player: { x: 0, y: 0 }, floatingTexts: [], shockwaves: [], animatedEffects: [], screenShake: 0 };
  class FloatingText { static acquire() { return {}; } }
  class Shockwave { constructor() {} }
  const callbacks = { updateUI() {} };
  let statLevels = 0;
  const source = functionSource('powerups.ts', 'export function triggerLevelUp()', 'export function omnislashHitDmg(');
  const triggerLevelUp = new Function('globals', 'FloatingText', 'Shockwave', 'vfxAnims', 'callbacks', 'applyStatLevelUp', 'playSynthesizedLevelUp', source + '; return triggerLevelUp')(
    globals, FloatingText, Shockwave, {}, callbacks, () => statLevels++, () => {});
  triggerLevelUp();
  assert.deepEqual([globals.level, globals.maxLives, globals.lives, statLevels], [2, 6, 4, 1]);
  globals.exp = 500;
  triggerLevelUp();
  assert.deepEqual([globals.level, globals.maxLives, globals.lives, statLevels], [5, 9, 7, 4]);
});
test('MURAMASA grants 100,000 currency once, case-insensitive, persists redemption', () => {
  const store = new Map();
  const inputEl = { value: 'muramasa' };
  const msgEl = { style: {}, textContent: '' };
  const document = { getElementById: id => id === 'redeem-input' ? inputEl : msgEl };
  const safeStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const globals = { currentLang: 'en', magatama: 0, screenShake: 0 };
  const source = functionSource('ui.ts', 'function processRedeemCode()', 'let dojoFilter =');
  const redeem = new Function('document', 'safeStorage', 'globals', 'refreshAllMagatamaDisplays', 'populateDojoHeroGrid', 'playShrineBlessing', 'triggerHapticFeedback', 'FloatingText', source + '; return processRedeemCode')(
    document, safeStorage, globals, () => {}, () => {}, () => {}, () => {}, { acquire() { return {}; } });
  redeem();
  assert.equal(globals.magatama, 100000);
  assert.equal(store.get('stickmurai_magatama'), '100000');
  inputEl.value = 'MURAMASA';
  redeem();
  assert.equal(globals.magatama, 100000);
  assert.match(msgEl.textContent, /already been redeemed/);
});
