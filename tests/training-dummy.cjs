const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');

// Mock Enemy base class for Node test environment
class MockEnemy {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.isTrainingDummy = false;
    this.hp = 10;
    this.maxHp = 10;
    this.hpDelayed = 10;
    this.state = 'idle';
    this.stateTime = 0;
    this.posture = 0;
    this.maxPosture = 60;
    this.postureBrokenTimer = 0;
    this.stunTimer = 0;
    this.hitFlash = 0;
    this.vx = 0;
    this.vy = 0;
  }
}

const mockCallbacks = {
  checkPlayerHit: (_dummy, _dmg) => {},
};

const dummySource = stripTypeScriptTypes(fs.readFileSync('src/trainingDummy.ts', 'utf8'));
const { TrainingDummy } = new Function(
  'Enemy',
  'callbacks',
  dummySource
    .replace(/import .*/g, '')
    .replace(/export /g, '') +
    '; return { TrainingDummy };'
)(MockEnemy, mockCallbacks);

test('TrainingDummy constructor initializes 1000 HP, base position, and stationary mode', () => {
  const player = { x: 500, y: 400, state: 'idle' };
  const dummy = new TrainingDummy(600, 400, player);

  assert.equal(dummy.isTrainingDummy, true);
  assert.equal(dummy.hp, 1000);
  assert.equal(dummy.maxHp, 1000);
  assert.equal(dummy.mode, 'stationary');
  assert.equal(dummy.startX, 600);
  assert.equal(dummy.startY, 400);
});

test('TrainingDummy lethal damage immediately replenishes to 1000 HP without death transition', () => {
  const player = { x: 500, y: 400 };
  const dummy = new TrainingDummy(600, 400, player);

  // Take lethal damage
  dummy.hp = -50;
  dummy.update(0.016);

  assert.equal(dummy.hp, 1000);
  assert.equal(dummy.hpDelayed, 1000);
  assert.notEqual(dummy.state, 'dead');
});

test('TrainingDummy position recoil is clamped to max 10 units and springs back to start', () => {
  const player = { x: 500, y: 400 };
  const dummy = new TrainingDummy(600, 400, player);

  // Large knockback displacement
  dummy.x = 650;
  dummy.y = 400;

  dummy.update(0.016);
  // Displacement clamped to at most 10 units from startX (600)
  assert.ok(Math.abs(dummy.x - 600) <= 10.1);

  // Over several frames of spring-back, returns closer to startX
  for (let i = 0; i < 60; i++) {
    dummy.update(0.016);
  }
  assert.ok(Math.abs(dummy.x - 600) < 0.5);
});

test('TrainingDummy sparring mode executes telegraph windup then strike cadence', () => {
  let hitPlayerCalled = false;
  mockCallbacks.checkPlayerHit = (enemy, dmg) => {
    hitPlayerCalled = true;
  };

  const player = { x: 620, y: 400 };
  const dummy = new TrainingDummy(600, 400, player);
  dummy.setMode('sparring');

  assert.equal(dummy.mode, 'sparring');
  assert.equal(dummy.state, 'idle');

  // Advance cadence timer (3.0s)
  dummy.update(3.0);
  assert.equal(dummy.state, 'charge');

  // Windup for 1.2s
  dummy.update(1.25);
  assert.equal(dummy.state, 'attack');

  // Attack strike window triggers hit
  dummy.update(0.15);
  assert.equal(hitPlayerCalled, true);

  // Finish attack duration
  dummy.update(0.4);
  assert.equal(dummy.state, 'idle');
  assert.equal(dummy.sparringCadenceTimer, 3.0);
});

test('TrainingDummy resetDummy restores full health, base position, and clears statuses', () => {
  const player = { x: 500, y: 400 };
  const dummy = new TrainingDummy(600, 400, player);

  dummy.x = 610;
  dummy.hp = 300;
  dummy.posture = 50;
  dummy.burnTimer = 2.0;
  dummy.stunTimer = 1.0;
  dummy.state = 'charge';

  dummy.resetDummy();

  assert.equal(dummy.x, 600);
  assert.equal(dummy.y, 400);
  assert.equal(dummy.hp, 1000);
  assert.equal(dummy.posture, 0);
  assert.equal(dummy.burnTimer, 0);
  assert.equal(dummy.stunTimer, 0);
  assert.equal(dummy.state, 'idle');
});
