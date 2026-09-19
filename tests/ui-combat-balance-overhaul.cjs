const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('ui-combat-balance-overhaul: verifies all 7 user requests', (t) => {
  const root = path.resolve(__dirname, '..');

  // 1. Mouse wheel scrolling in index.html
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexHtml, /Poki SDK: Prevent page scroll/, 'Preserves Poki SDK comment');
  assert.match(indexHtml, /target\.scrollHeight\s*>\s*target\.clientHeight/, 'Allows scrolling in scrollable containers');

  // 2. Slash Elixir price in powerups.ts
  const powerupsTs = fs.readFileSync(path.join(root, 'src', 'powerups.ts'), 'utf8');
  assert.match(powerupsTs, /id="shop-potion-btn"[\s\S]*?stage_gold\.png[\s\S]*?50/, 'Shop UI displays 50 gold for Slash Elixir');
  assert.match(powerupsTs, /stageCurrency\s*\|\|\s*0\)\s*<\s*50/, 'buyOnePotion checks 50 currency minimum');
  assert.match(powerupsTs, /stageCurrency\s*-=\s*50/, 'buyOnePotion deducts 50 currency');

  // 3. Level up scaling with slash damage %
  const mainTs = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
  assert.match(mainTs, /stageLevelPct\s*=\s*Math\.max\(0,\s*\(globals\.level\s*\|\|\s*1\)\s*-\s*1\)\s*\*\s*0\.10/, 'getCurrentSlashDamage adds +10% per stage level');
  assert.match(powerupsTs, /slashBonusDmgPct\s*\+=\s*0\.10/, 'applyStatLevelUp grants +10% slash dmg guaranteed');

  // 4. Mikiri Stride / Counter-Flash 1.8s ICD
  assert.match(mainTs, /mikiriCooldownMs\s*=\s*1800/, 'Mikiri Stride has 1800ms internal cooldown');
  assert.match(mainTs, /globals\.lastMikiriStrideTime\s*=\s*nowMikiri/, 'Mikiri Stride updates timestamp on trigger');

  // 5. Atherion Mobile Combos & 3rd-strike weave
  const playerTs = fs.readFileSync(path.join(root, 'src', 'player.ts'), 'utf8');
  assert.match(playerTs, /previousCharge\s*>=\s*0\.20/, 'Dimension Rend charge threshold relaxed to 0.20');
  assert.match(playerTs, /slashDelta\s*<\s*650\s*\|\|\s*shootDelta\s*<\s*650/, 'Phase warp combo window widened to 650ms');
  assert.match(mainTs, /globals\.selectedHero\s*===\s*'aetherion'\s*&&\s*globals\.comboSlashesCount\s*>=\s*3/, '3rd combo strike weaves Atherion ranged beam');

  // 6. Mobile Skill Direction Controller Wheel for Atherion Ranged
  const inputTs = fs.readFileSync(path.join(root, 'src', 'input.ts'), 'utf8');
  assert.match(inputTs, /aetherionTouchId/, 'btnStanceSwitch tracks touch drag for aiming');
  assert.match(inputTs, /globals\.mobileAetherionAimAngle\s*=\s*Math\.atan2/, 'Computes aim angle on drag');
  assert.match(inputTs, /globals\.useMobileAetherionAimAngle\s*=\s*true/, 'Sets useMobileAetherionAimAngle flag on release');

  const globalsTs = fs.readFileSync(path.join(root, 'src', 'globals.ts'), 'utf8');
  assert.match(globalsTs, /mobileAetherionAimActive:\s*false/, 'globals exports mobileAetherionAimActive');
  assert.match(globalsTs, /mobileAetherionAimAngle:\s*0/, 'globals exports mobileAetherionAimAngle');

  // 7. Direction Indicator visual overhaul
  const rendererTs = fs.readFileSync(path.join(root, 'src', 'renderer.ts'), 'utf8');
  assert.match(rendererTs, /globals\.mobileAetherionAimActive/, 'Renderer draws Atherion aim preview');
  assert.match(rendererTs, /drawAimReticle/, 'Renderer uses polished aerodynamic aim reticles');
  assert.match(rendererTs, /drawAimCompass/, 'Renderer uses runic directional compass at player feet');
  assert.doesNotMatch(rendererTs, /ctx\.shadowBlur\s*=\s*[1-9]/, 'No shadowBlur in frame rendering');

  // 8. SVGs overhaul
  const movSvg = fs.readFileSync(path.join(root, 'public', 'ui', 'technique-movement.svg'), 'utf8');
  const slaSvg = fs.readFileSync(path.join(root, 'public', 'ui', 'technique-slash.svg'), 'utf8');
  assert.match(movSvg, /viewBox="0 0 280 154"/, 'Movement SVG has correct viewBox');
  assert.match(slaSvg, /viewBox="0 0 280 154"/, 'Slash SVG has correct viewBox');
  assert(movSvg.length > 3000, 'Movement SVG contains high-fidelity artwork');
  assert(slaSvg.length > 3000, 'Slash SVG contains high-fidelity artwork');
});
