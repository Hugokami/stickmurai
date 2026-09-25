const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { stripTypeScriptTypes } = require('node:module');

const globals = { currentStage: 1, currentLang: 'en', player: { x: 0, y: 0, state: 'idle' }, screenShake: 0, shockwaves: [], floatingTexts: [], projectiles: [], delayedActions: [], animatedEffects: [] };
const hits = [];
const callbacks = { checkPlayerHit: (_enemy, damage) => hits.push(damage) };
class Shockwave { constructor() {} }
class FloatingText { static acquire() { return {}; } }
class AnimatedEffect { constructor() {} }
class Projectile { static acquire(x, y, angle, _enemy, damage) { return { x, y, angle, damage, vx: 0, vy: 0 }; } static acquireFireball(x, y, angle, _enemy, damage) { return { x, y, angle, damage, vx: 0, vy: 0 }; } }
const stubs = { globals, callbacks, BOSS_BASE_HP: { oni_boss: 100, shogun_boss: 100, agis_colossus: 100, skeleton_warlord: 100 }, Shockwave, FloatingText, AnimatedEffect, Projectile, playSynthesizedThunder() {}, vfxAnims: { boss: {} } };
function load(name) {
  const source = stripTypeScriptTypes(fs.readFileSync(path.join(__dirname, '..', 'src', 'bosses', name + '.ts'), 'utf8'));
  const code = source.replace(/import [^;]+;/g, '').replace(/export /g, '');
  return new Function(...Object.keys(stubs), code + `; return ${name}BossBehavior`)(...Object.values(stubs));
}
function cast(name, x, y, angle = 0) {
  Object.assign(globals, { currentStage: 1, player: { x, y, state: 'idle' }, screenShake: 0, shockwaves: [], floatingTexts: [], projectiles: [], delayedActions: [], animatedEffects: [] });
  hits.length = 0;
  const enemy = { x: 0, y: 0, state: 'attack', targetAngle: angle, attackLanded: false };
  load(name).castSpell(enemy);
  return { enemy, damage: [...hits], projectiles: globals.projectiles, actions: [...globals.delayedActions] };
}
test('Oni slam: escape circle, single threat, 1 heart', () => {
  assert.deepEqual(cast('oni', 0, 0).damage, [1]);
  const safe = cast('oni', 250, 0);
  assert.deepEqual(safe.damage, []);
  assert.equal(safe.projectiles.length, 0);
});
test('Shogun flurry: visible center lane, side shots, no instant circle hit', () => {
  const spell = cast('shogun', 0, 0);
  assert.deepEqual(spell.damage, []);
  assert.ok(spell.projectiles.length > 0);
  assert.ok(spell.projectiles.every(p => p.damage === 1 && Math.abs(p.angle) >= 0.2 && Math.abs(p.y) === 115));
});
test('Warlord cleave: behind safe, front hit costs 1 heart', () => {
  assert.deepEqual(cast('warlord', 140, 0).damage, [1]);
  const behind = cast('warlord', -140, 0);
  assert.deepEqual(behind.damage, []);
  assert.equal(behind.projectiles.length, 0);
});
test('Colossus: slam then ring with safe interior, no third follow-up', () => {
  const inside = cast('colossus', 0, 0);
  assert.deepEqual(inside.damage, [2]);
  assert.equal(inside.actions.length, 1);
  inside.actions[0].run();
  assert.deepEqual(hits, [2]);
  const ring = cast('colossus', 240, 0);
  assert.deepEqual(ring.damage, []);
  ring.actions[0].run();
  assert.deepEqual(hits, [1]);
  const outside = cast('colossus', 360, 0);
  outside.actions[0].run();
  assert.deepEqual(hits, []);
});
test('locked boss attacks do not re-aim at a player who dodges behind', () => {
  const source = stripTypeScriptTypes(fs.readFileSync(path.join(__dirname, '..', 'src', 'enemy.ts'), 'utf8'));
  const executeAttack = source.slice(source.indexOf('  executeAttack() {'), source.indexOf('  triggerCustomSpellCast('));
  const enemy = { subType: 'skeleton_warlord', x: 0, y: 0, target: { x: -100, y: 0 }, targetAngle: 0, state: 'attack', meleeHitRadius: 220 };
  const calls = [];
  const isBossType = subType => subType === 'skeleton_warlord';
  const checkPlayerHit = (_enemy, damage) => calls.push(damage);
  const method = new Function('globals', 'callbacks', 'isBossType', 'Shockwave', 'triggerBarrelExplosion', 'castBossSpell', `return ({${executeAttack}}).executeAttack`)(
    { decoys: [] }, { checkPlayerHit }, isBossType, Shockwave, () => {}, () => {});
  method.call(enemy);
  assert.deepEqual(calls, []);
  enemy.target.x = 100;
  method.call(enemy);
  assert.deepEqual(calls, [undefined]);
});
test('boss damage is capped at two hearts after stage affixes', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
  const start = source.indexOf('function checkPlayerHit(');
  const end = source.indexOf("if (globals.selectedSkill === 'shield'", start);
  assert.match(source.slice(start, end), /damageAmount \+= 1;[\s\S]*isBossType\(enemy\?\.subType\)\) damageAmount = Math\.min\(2, damageAmount\)/);
});
test('late-stage boss spell never stacks overlapping damage or fires lethal projectiles', () => {
  for (const name of ['oni', 'shogun', 'warlord', 'colossus']) {
    cast(name, 0, 0);
    globals.currentStage = 60;
    hits.length = 0;
    const enemy = { x: 0, y: 0, state: 'attack', targetAngle: 0, attackLanded: false };
    load(name).castSpell(enemy);
    assert.ok(hits.every(d => d <= 2), name);
    assert.ok(globals.projectiles.every(p => p.damage <= 2), name);
  }
});
