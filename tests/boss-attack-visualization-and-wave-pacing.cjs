// @ts-check
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const enemySrc = fs.readFileSync(path.join(__dirname, '../src/enemy.ts'), 'utf8');
const mainSrc = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');

test('boss attack telegraph: covers full attackRange (420-450px) with precise close damage hitbox', () => {
  // Verifies attackRange and closeHitRadius calculations
  assert.ok(enemySrc.includes("const attackRange = this.subType === 'shogun_boss' ? 450"), 'Shogun attackRange 450');
  assert.ok(enemySrc.includes(": this.subType === 'agis_colossus' ? 440"), 'Colossus attackRange 440');
  assert.ok(enemySrc.includes(": 420; // oni_boss, skeleton_warlord"), 'Oni and Warlord attackRange 420');

  // Verifies outer range arc and directional centerline
  assert.ok(enemySrc.includes('ctx.arc(0, 0, attackRange,'), 'renders outer attackRange arc');
  assert.ok(enemySrc.includes('ctx.lineTo(Math.cos(this.targetAngle) * attackRange, Math.sin(this.targetAngle) * attackRange)'), 'renders directional centerline out to attackRange');

  // Verifies boss attack pattern corridors
  assert.ok(enemySrc.includes('this.targetAngle - 0.18, this.targetAngle + 0.18'), 'Oni twin fireball corridors');
  assert.ok(enemySrc.includes('[-0.25, 0, 0.25]'), 'Warlord 3-way void wave spread corridors');
  assert.ok(enemySrc.includes('[-0.3, -0.1, 0.1, 0.3]'), 'Shogun 4-kunai fan corridors');

  // Verifies precise close damage hitbox and dynamic charge progression
  assert.ok(enemySrc.includes('closeHitRadius * p'), 'dynamic charge-up progression fill matching damage hitbox');
  assert.ok(enemySrc.includes('closeHitRadius = this.subType === \'skeleton_warlord\' ? (late ? 280 : 220)'), 'Warlord cleave hitbox');
  assert.ok(enemySrc.includes('Math.max(this.meleeHitRadius, late ? 260 : 230)'), 'Oni slam hitbox matches meleeHitRadius');
});

test('wave pacing: increased wave quotas and strict all-spawned-enemies-dead clear gate', () => {
  // Wave quota scaling
  assert.ok(mainSrc.includes('globals.waveEnemiesTotal = wave === 1 ? 5 : 7;'), 'Stage 1 quotas increased to 5 and 7');
  assert.ok(mainSrc.includes('Math.min(9, 5 + wave)'), 'Stages 2-3 quotas increased to 6-8');
  assert.ok(mainSrc.includes('Math.min(14, 6 + wave + Math.floor(stage / 5))'), 'Late stage quotas scale up to 14');

  // Strict wave clear gate
  assert.ok(mainSrc.includes('allKilled && allSpawned && aliveEnemies === 0'), 'wave clear strictly requires all enemies spawned and all enemies killed');
});
