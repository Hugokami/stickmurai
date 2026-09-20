const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

test('Merchant Cache Ad Invariants: max 2 per stage, +100 gold each', () => {
  const powerupsSrc = fs.readFileSync(path.join(projectRoot, 'src', 'powerups.ts'), 'utf-8');
  const globalsSrc = fs.readFileSync(path.join(projectRoot, 'src', 'globals.ts'), 'utf-8');
  const mainSrc = fs.readFileSync(path.join(projectRoot, 'src', 'main.ts'), 'utf-8');

  // Globals has stageMerchantCacheAds
  assert.match(globalsSrc, /stageMerchantCacheAds:\s*0/);

  // Powerups limits to 2 ads per stage
  assert.match(powerupsSrc, /const maxCacheAds\s*=\s*2/);
  assert.match(powerupsSrc, /globals\.stageMerchantCacheAds\s*\|\|\s*0/);

  // Powerups awards exactly +100 gold
  assert.match(powerupsSrc, /globals\.stageCurrency\s*=\s*\(globals\.stageCurrency\s*\|\|\s*0\)\s*\+\s*100/);
  assert.match(powerupsSrc, /\+100 GOLD CACHE! 💰/);

  // Powerups resets stageMerchantCacheAds on resetShop
  assert.match(powerupsSrc, /globals\.stageMerchantCacheAds\s*=\s*0/);

  // Main resets stageMerchantCacheAds on new stage
  assert.match(mainSrc, /globals\.stageMerchantCacheAds\s*=\s*0/);
});

test('Slash Visual Invariants: non-sprite vector arcs removed, sprite opacity boosted', () => {
  const entitiesSrc = fs.readFileSync(path.join(projectRoot, 'src', 'entities.ts'), 'utf-8');

  // Non-sprite vector strokes removed from Slash.draw
  assert.ok(!entitiesSrc.includes('Outer backing dark brush stroke'), 'Dark brush stroke should be removed');
  assert.ok(!entitiesSrc.includes('Main crescent gradient ribbon'), 'Canvas radial gradient ribbon should be removed');
  assert.ok(!entitiesSrc.includes('Razor-sharp white cutting edge'), 'Synthetic white stroke cutting edge should be removed');
  assert.ok(!entitiesSrc.includes('Colored outer accent edge'), 'Synthetic colored outer stroke should be removed');

  // High opacity sprite rendering present
  assert.match(entitiesSrc, /tailFade\s*=\s*progress\s*>\s*0\.8\s*\?\s*\(1\.0\s*-\s*progress\)\s*\/\s*0\.2\s*:\s*1\.0/);
  assert.match(entitiesSrc, /ctx\.globalAlpha\s*=\s*Math\.min\(1\.0,\s*opacityMult\s*\*\s*tailFade\)/);
});

test('Dojo Training UI Exit Invariants: cleans up bar and dummy on quit to menu', () => {
  const runtimeQolSrc = fs.readFileSync(path.join(projectRoot, 'src', 'runtimeQol.ts'), 'utf-8');
  const mainSrc = fs.readFileSync(path.join(projectRoot, 'src', 'main.ts'), 'utf-8');
  const uiSrc = fs.readFileSync(path.join(projectRoot, 'src', 'ui.ts'), 'utf-8');

  // exitPractice is exported
  assert.match(runtimeQolSrc, /export\s+function\s+exitPractice/);

  // handleQuitToMainMenu calls exitPractice and removes training elements
  assert.match(mainSrc, /if\s*\(isPractice\(\)\)\s*\{\s*exitPractice\(true\);\s*\}/);
  assert.match(mainSrc, /document\.getElementById\('qol-practice-bar'\)\?\.remove\(\)/);
  assert.match(mainSrc, /document\.getElementById\('qol-practice-dummy'\)\?\.remove\(\)/);

  // ui.ts quit-btn cleans up practice bar and dummy
  assert.match(uiSrc, /document\.getElementById\('qol-practice-bar'\)\?\.remove\(\)/);
  assert.match(uiSrc, /document\.getElementById\('qol-practice-dummy'\)\?\.remove\(\)/);
});

test('Hero Atherion Alignment Invariants: sprite centered, shadow and ring foot offset aligned', () => {
  const entitiesSrc = fs.readFileSync(path.join(projectRoot, 'src', 'entities.ts'), 'utf-8');
  const playerSrc = fs.readFileSync(path.join(projectRoot, 'src', 'player.ts'), 'utf-8');
  const rendererSrc = fs.readFileSync(path.join(projectRoot, 'src', 'renderer.ts'), 'utf-8');

  // Entities centers Atherion sprite horizontally (-5 * scale)
  assert.match(entitiesSrc, /const aethOffsetX\s*=\s*\(this\.type\s*===\s*'heroaetherion'\s*\?\s*-5\s*:\s*0\)\s*\*\s*scale/);
  assert.match(entitiesSrc, /-img\.width\/2\s*\*\s*scale\s*\+\s*aethOffsetX/);

  // Player foot offset for Atherion is 75 for neon ring
  assert.match(playerSrc, /this\.type\s*===\s*'heroaetherion'\s*\?\s*75\s*:\s*62/);

  // Player foot offset for Atherion shadow is 75 (not 150)
  assert.ok(!playerSrc.includes("'heroaetherion' ? 150 : 62"), 'Shadow offset should not be 150');

  // Renderer baseFoot for Atherion is 75 (not 102)
  assert.match(rendererSrc, /case 'heroaetherion':\s*baseFoot\s*=\s*75;\s*break;/);
});

test('Stage Clear Star Conditions: 2-star is 30 parries+dodges, 3-star is >80% health', () => {
  const uiTs = fs.readFileSync(path.join(projectRoot, 'src', 'ui.ts'), 'utf-8');
  const qolTs = fs.readFileSync(path.join(projectRoot, 'src', 'progressionQol.ts'), 'utf-8');
  const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf-8');

  // Check ui.ts evaluation
  assert.match(uiTs, /totalParriesAndDodges\s*>=\s*30/, 'ui.ts must evaluate 30 parries + dodges for star 2');
  assert.match(uiTs, /healthPercent\s*>\s*80/, 'ui.ts must evaluate >80% health for star 3');

  // Check stage select briefing card
  assert.match(qolTs, /30 Parries & Dodges/, 'progressionQol.ts must state 30 Parries & Dodges');
  assert.match(qolTs, />80% HP/, 'progressionQol.ts must state >80% HP');

  // Check index.html markup fallback
  assert.match(indexHtml, /30 Parries & Dodges/, 'index.html must display 30 Parries & Dodges in star-req-2');
  assert.match(indexHtml, /(?:>|&gt;)80% Health/, 'index.html must display >80% Health in star-req-3');
});
