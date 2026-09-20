const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsTs = fs.readFileSync(path.join(root, 'src/assets.ts'), 'utf8');
const balanceTs = fs.readFileSync(path.join(root, 'src/balance.ts'), 'utf8');
const powerupsTs = fs.readFileSync(path.join(root, 'src/powerups.ts'), 'utf8');
const uiTs = fs.readFileSync(path.join(root, 'src/ui.ts'), 'utf8');

test('Short Key-Point Descriptions Invariants: assets.ts powerups and skills', () => {
  // All pu*Desc and skill*Desc should use bullet points (•) and be compact (< 120 chars)
  const descMatches = [...assetsTs.matchAll(/(\w+Desc):\s*\"([^\"]*)\"/g)];
  assert.ok(descMatches.length >= 70, `Expected at least 70 descriptions in assets.ts, found ${descMatches.length}`);

  for (const [, key, desc] of descMatches) {
    // Check that bullet point • is used
    assert.ok(
      desc.includes('•'),
      `Description ${key} should include bullet point '•', got: "${desc}"`
    );
    // Ensure brevity: every description should be under 125 chars (no paragraph lore)
    assert.ok(
      desc.length <= 125,
      `Description ${key} should be short (<=125 chars), got length ${desc.length}: "${desc}"`
    );
  }
});

test('Short Key-Point Descriptions Invariants: balance.ts hero passives and awakenings', () => {
  const passiveEnMatches = [...balanceTs.matchAll(/passiveEn:\s*'([^']+)'/g)];
  assert.equal(passiveEnMatches.length, 8, '8 hero passives in balance.ts');
  for (const [, desc] of passiveEnMatches) {
    assert.ok(desc.includes('•'), `Hero passive should include '•', got: "${desc}"`);
    assert.ok(desc.length <= 100, `Hero passive should be concise (<=100 chars), got: "${desc}"`);
  }

  const awakeningMatches = [...balanceTs.matchAll(/descEn:\s*'([^']+)'/g)];
  assert.equal(awakeningMatches.length, 8, '8 hero awakenings in balance.ts');
  for (const [, desc] of awakeningMatches) {
    assert.ok(desc.includes('•'), `Hero awakening should include '•', got: "${desc}"`);
    assert.ok(desc.length <= 100, `Hero awakening should be concise (<=100 chars), got: "${desc}"`);
  }
});

test('Short Key-Point Descriptions Invariants: powerups.ts fusions and ui.ts ascension', () => {
  const fusionMatches = [...powerupsTs.matchAll(/descEn:\s*'([^']+)'/g)];
  assert.equal(fusionMatches.length, 5, '5 fusion recipes in powerups.ts');
  for (const [, desc] of fusionMatches) {
    assert.ok(desc.includes('•'), `Fusion description should include '•', got: "${desc}"`);
    assert.ok(desc.length <= 100, `Fusion description should be concise (<=100 chars), got: "${desc}"`);
  }

  const ascensionSection = uiTs.slice(uiTs.indexOf('ASCENSION_UPGRADES: AscensionUpgrade[] = ['));
  const ascensionMatches = [...ascensionSection.matchAll(/desc:\s*'([^']+)'/g)];
  assert.ok(ascensionMatches.length >= 6, 'At least 6 ascension upgrades in ui.ts');
  for (const [, desc] of ascensionMatches) {
    assert.ok(desc.includes('•'), `Ascension description should include '•', got: "${desc}"`);
    assert.ok(desc.length <= 60, `Ascension description should be very short (<=60 chars), got: "${desc}"`);
  }
});
