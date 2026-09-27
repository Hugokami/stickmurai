const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('gameplay improvements: ranged density cap and attack ranges', () => {
  const enemySrc = fs.readFileSync(path.resolve(__dirname, '../src/enemy.ts'), 'utf8');

  // Verify active ranged cap is 2-4
  assert.ok(enemySrc.includes("stage >= 9 ? 4 : (stage >= 5 ? 3 : 2)"), 'Ranged density must cap between 2 and 4');

  // Verify ranged enemy attackRange is constrained to screen view (<= 850px)
  const ranges = [
    { subType: 'musketeer', max: 750 },
    { subType: 'pyromancer', max: 720 },
    { subType: 'astromancer', max: 780 },
    { subType: 'necromancer', max: 720 },
    { subType: 'toaster_bot', max: 720 },
    { subType: 'shadow_sniper', max: 820 },
    { subType: 'tengu_sorcerer', max: 750 },
    { subType: 'corrupted_shaman', max: 750 }
  ];

  for (const { subType, max } of ranges) {
    const regex = new RegExp(`subType === '${subType}'\\) \\{\\s*attackRange = (\\d+);`);
    const match = enemySrc.match(regex);
    assert.ok(match, `Missing attackRange definition for ${subType}`);
    const rangeVal = parseInt(match[1], 10);
    assert.ok(rangeVal <= max, `${subType} attackRange ${rangeVal} exceeds view limit ${max}`);
  }
});

test('gameplay improvements: boss posture regen paused on damage', () => {
  const enemySrc = fs.readFileSync(path.resolve(__dirname, '../src/enemy.ts'), 'utf8');
  assert.ok(enemySrc.includes('postureRegenPauseTimer = 3.0'), 'postureRegenPauseTimer must pause poise recovery on damage');
  assert.ok(!enemySrc.includes('28 * effectiveDt'), 'Unfair 28/s boss poise regen must be removed');
});

test('gameplay improvements: dash cooldown scales down to 0.4s and not clamped to 1.72s', () => {
  const playerSrc = fs.readFileSync(path.resolve(__dirname, '../src/player.ts'), 'utf8');
  assert.ok(!playerSrc.includes('Math.max(1.72'), 'Dash cooldown must not be hardcoded clamped to 1.72s');
  assert.ok(playerSrc.includes('Math.max(0.4'), 'Dash cooldown must support scaling down to 0.4s');
});

test('gameplay improvements: skill synergy passives defined and hooked', () => {
  const powerupSrc = fs.readFileSync(path.resolve(__dirname, '../src/powerups.ts'), 'utf8');
  assert.ok(powerupSrc.includes('export function applySynergyPassives()'), 'applySynergyPassives must be exported');
  assert.ok(powerupSrc.includes('synergySlashBonusPct'), 'synergySlashBonusPct must be calculated');
  assert.ok(powerupSrc.includes('hasBladeBleedSynergy'), 'hasBladeBleedSynergy must be tracked');
  assert.ok(powerupSrc.includes('hasShadowCloneSynergy'), 'hasShadowCloneSynergy must be tracked');
  assert.ok(powerupSrc.includes('hasIronDeflectSynergy'), 'hasIronDeflectSynergy must be tracked');
  assert.ok(powerupSrc.includes('hasElementChainSynergy'), 'hasElementChainSynergy must be tracked');

  const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
  assert.ok(mainSrc.includes('hasBladeBleedSynergy'), 'hasBladeBleedSynergy hooked in main combat');
  assert.ok(mainSrc.includes('hasIronDeflectSynergy'), 'hasIronDeflectSynergy hooked in projectile deflection');
  assert.ok(mainSrc.includes('hasElementChainSynergy'), 'hasElementChainSynergy hooked in elemental procs');
});
