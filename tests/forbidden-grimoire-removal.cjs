const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Forbidden Grimoire Skills Removal Invariants', async (t) => {
  const root = path.join(__dirname, '..');
  const powerupsTs = fs.readFileSync(path.join(root, 'src', 'powerups.ts'), 'utf8');
  const playerTs = fs.readFileSync(path.join(root, 'src', 'player.ts'), 'utf8');
  const mainTs = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
  const rendererTs = fs.readFileSync(path.join(root, 'src', 'renderer.ts'), 'utf8');
  const uiTs = fs.readFileSync(path.join(root, 'src', 'ui.ts'), 'utf8');

  await t.test('FUSION_RECIPES is empty in powerups.ts', () => {
    assert.match(powerupsTs, /export const FUSION_RECIPES:\s*FusionRecipe\[\]\s*=\s*\[\s*\];/, 'FUSION_RECIPES must be empty array');
    assert.doesNotMatch(powerupsTs, /key:\s*['"]plasma_tempest['"]/, 'plasma_tempest must not be in powerups.ts');
    assert.doesNotMatch(powerupsTs, /key:\s*['"]singularity_cleave['"]/, 'singularity_cleave must not be in powerups.ts');
    assert.doesNotMatch(powerupsTs, /key:\s*['"]hundred_phantoms['"]/, 'hundred_phantoms must not be in powerups.ts');
    assert.doesNotMatch(powerupsTs, /key:\s*['"]kamaitachi['"]/, 'kamaitachi must not be in powerups.ts');
    assert.doesNotMatch(powerupsTs, /key:\s*['"]asura_storm['"]/, 'asura_storm must not be in powerups.ts');
  });

  await t.test('Shop badges do not hint at removed fusion arts', () => {
    assert.doesNotMatch(powerupsTs, /PLASMA<\/div>/, 'PLASMA badge must not appear in shop');
    assert.doesNotMatch(powerupsTs, /SINGULARITY<\/div>/, 'SINGULARITY badge must not appear in shop');
    assert.doesNotMatch(powerupsTs, /PHANTOMS<\/div>/, 'PHANTOMS badge must not appear in shop');
    assert.doesNotMatch(powerupsTs, /KAMAITACHI<\/div>/, 'KAMAITACHI badge must not appear in shop');
  });

  await t.test('player.ts has no hundred_phantoms or plasma_tempest procs', () => {
    assert.doesNotMatch(playerTs, /hundred_phantoms/, 'player.ts must not reference hundred_phantoms');
    assert.doesNotMatch(playerTs, /plasma_tempest/, 'player.ts must not reference plasma_tempest');
  });

  await t.test('main.ts combat hooks have no fusion skills', () => {
    assert.doesNotMatch(mainTs, /activeFusions\.has\(['"]plasma_tempest['"]\)/, 'main.ts must not check plasma_tempest');
    assert.doesNotMatch(mainTs, /activeFusions\.has\(['"]singularity_cleave['"]\)/, 'main.ts must not check singularity_cleave');
    assert.doesNotMatch(mainTs, /activeFusions\.has\(['"]hundred_phantoms['"]\)/, 'main.ts must not check hundred_phantoms');
    assert.doesNotMatch(mainTs, /activeFusions\.has\(['"]kamaitachi['"]\)/, 'main.ts must not check kamaitachi');
    assert.doesNotMatch(mainTs, /activeFusions\.has\(['"]asura_storm['"]\)/, 'main.ts must not check asura_storm');
  });

  await t.test('renderer.ts does not render plasma trails or bouncing sickles', () => {
    assert.doesNotMatch(rendererTs, /Draw Plasma Tempest Electric Napalm/, 'renderer.ts must not draw plasma trails');
    assert.doesNotMatch(rendererTs, /Draw Kamaitachi Razor Wind Scythes/, 'renderer.ts must not draw kamaitachi scythes');
  });

  await t.test('ui.ts grimoire grid renders cleanly without fusion cards', () => {
    assert.doesNotMatch(uiTs, /grimoire-card discovered/, 'ui.ts must not generate fusion cards in grimoire grid');
    assert.doesNotMatch(uiTs, /Active Fusions/, 'ui.ts must not reference Active Fusions in victory modal');
  });
});
