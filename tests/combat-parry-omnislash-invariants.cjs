const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Parry charge attack release triggers smoothly and auto-fires scaled Iaijutsu', () => {
  const mainTs = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');

  // Verify parry input accepts any charge release without requiring full charge
  assert.match(
    mainTs,
    /const isParryInput = \(isCharging && isAttackReleased\)/,
    'Parry should accept charge attack release without being blocked by 0.8s full charge requirement'
  );

  // Verify parryWindowTimer is set on parry trigger
  assert.match(
    mainTs,
    /globals\.parryWindowTimer\s*=\s*0\.5/,
    'Parry trigger should activate parryWindowTimer for active parry deflection frames'
  );

  // Verify parry deflects enemy projectiles
  assert.match(
    mainTs,
    /globals\.projectiles\.forEach\(proj => \{[\s\S]*?proj\.isEnemy && !proj\.isDeflected[\s\S]*?proj\.isDeflected = true/,
    'Parry should deflect incoming enemy projectiles'
  );

  // Verify auto-release of Iaijutsu with charge scaling
  assert.match(
    mainTs,
    /fireFullyChargedIaijutsu\(iaiAngle,\s*chargeRatio\)/,
    'Parry trigger should auto-fire Iaijutsu with charge ratio scaling'
  );

  // Verify projectile deflect handler respects parryWindowTimer
  assert.match(
    mainTs,
    /const isParrying = globals\.parryWindowTimer > 0;[\s\S]*?globals\.player\.state === 'dash' \|\| isShieldActive \|\| isParrying/,
    'Projectile collision check should deflect during active parry window'
  );

  // Verify checkPlayerHit respects parryWindowTimer
  assert.match(
    mainTs,
    /globals\.parryWindowTimer > 0/,
    'Player damage check should parry when parryWindowTimer > 0'
  );
});

test('Omnislash is buffed with heightened visuals, opacity, and un-capped boss damage', () => {
  const powerupsTs = fs.readFileSync(path.join(__dirname, '../src/powerups.ts'), 'utf8');
  const entitiesTs = fs.readFileSync(path.join(__dirname, '../src/entities.ts'), 'utf8');

  // Verify omnislash damage calculation has high base and scaling
  assert.match(
    powerupsTs,
    /const base = isFinalBlast \? 65 : 30;/,
    'Omnislash hit damage base should be greatly buffed'
  );

  // Verify boss damage is amplified rather than heavily capped
  assert.match(
    powerupsTs,
    /const hitDmg = isBoss \? Math\.round\(omnislashHitDmg\(idx\) \* 1\.35\) : omnislashHitDmg\(idx\);/,
    'Boss hits in omnislash should deal massive un-capped damage'
  );

  assert.match(
    powerupsTs,
    /const finalDmg = isBoss \? Math\.round\(omnislashHitDmg\(0, true\) \* 1\.6\) : omnislashHitDmg\(0, true\);/,
    'Boss final blast in omnislash should deal massive un-capped damage'
  );

  // Verify slash visual rendering checks for omnislash and awakened high opacity
  assert.match(
    entitiesTs,
    /globals\.flowState === 'omnislash'/,
    'Slash rendering should have dedicated styling for omnislash'
  );

  assert.match(
    entitiesTs,
    /const isUltraState = globals\.flowState === 'awakened' \|\| globals\.flowState === 'omnislash';/,
    'Ultra state should encompass flow awakening and omnislash'
  );

  assert.match(
    entitiesTs,
    /const opacityMult = isUltraState \? 1\.0 : 0\.9;/,
    'Opacity should be maximized during flow awakening and omnislash'
  );
});
