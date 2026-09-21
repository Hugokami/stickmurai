const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');

const qolSource = stripTypeScriptTypes(fs.readFileSync('src/runtimeQol.ts', 'utf8'));
const cleanCode = qolSource
  .replace(/import\s*[\s\S]*?from\s*['"][^'"]+['"];?/g, '')
  .replace(/export\s+/g, '');

test('TrainingMetricsTracker tracks DPS in 5s window and combo damage with 2s expiry', () => {
  const { TrainingMetricsTracker } = new Function(
    'globals', 'setPracticeStorage', 'safeStorage', 'bindQolButton', 'showToast', 'callbacks', 'TrainingDummy', 'createTutorialSession', 'processLessonEvent', 'isLessonComplete',
    cleanCode + '; return { TrainingMetricsTracker };'
  )({}, () => {}, {}, () => {}, () => {}, {}, function(){}, () => {}, () => {}, () => {});

  assert.ok(TrainingMetricsTracker, 'TrainingMetricsTracker class should exist');
  const tracker = new TrainingMetricsTracker();

  // Record hit at t=1000 with 50 damage
  tracker.recordDamage(50, 1000);
  assert.equal(tracker.lastHit, 50);
  assert.equal(tracker.comboDamage, 50);
  assert.equal(tracker.bestComboDamage, 50);

  // Record hit at t=1800 with 75 damage
  tracker.recordDamage(75, 1800);
  assert.equal(tracker.lastHit, 75);
  assert.equal(tracker.comboDamage, 125);
  assert.equal(tracker.bestComboDamage, 125);

  // Advance time to t=4000 (> 2s without damage -> combo resets)
  tracker.update(4000);
  assert.equal(tracker.comboDamage, 0);
  assert.equal(tracker.bestComboDamage, 125); // Best combo preserved

  // Check 5s DPS window at t=4000 (total damage 125 over 5s = 25 DPS)
  const dps = tracker.getDps(4000);
  assert.equal(dps, 25);

  // Advance to t=7000 (> 5s since both hits -> DPS = 0)
  tracker.update(7000);
  assert.equal(tracker.getDps(7000), 0);
});

test('TrainingMetricsTracker records parries, dodges, and resets cleanly', () => {
  const { TrainingMetricsTracker } = new Function(
    'globals', 'setPracticeStorage', 'safeStorage', 'bindQolButton', 'showToast', 'callbacks', 'TrainingDummy', 'createTutorialSession', 'processLessonEvent', 'isLessonComplete',
    cleanCode + '; return { TrainingMetricsTracker };'
  )({}, () => {}, {}, () => {}, () => {}, {}, function(){}, () => {}, () => {}, () => {});

  const tracker = new TrainingMetricsTracker();
  tracker.recordDamage(100, 1000);
  tracker.recordParry();
  tracker.recordParry();
  tracker.recordDodge();

  assert.equal(tracker.parries, 2);
  assert.equal(tracker.dodges, 1);
  assert.equal(tracker.lastHit, 100);

  tracker.reset();
  assert.equal(tracker.parries, 0);
  assert.equal(tracker.dodges, 0);
  assert.equal(tracker.lastHit, 0);
  assert.equal(tracker.comboDamage, 0);
  assert.equal(tracker.bestComboDamage, 0);
  assert.equal(tracker.samples.length, 0);
});

test('Training dummy lifecycle in practiceStep maintains exactly one TrainingDummy', () => {
  const mockGlobals = {
    enemies: [
      { isTrainingDummy: true, hp: 1000, update: () => {} },
      { isTrainingDummy: false, hp: 20 }, // Stray regular enemy
    ],
    player: { x: 400, y: 300 },
    gameState: 'playing',
  };

  const { practiceStep, setPracticeState } = new Function(
    'globals', 'setPracticeStorage', 'safeStorage', 'bindQolButton', 'showToast', 'callbacks', 'TrainingDummy', 'createTutorialSession', 'processLessonEvent', 'isLessonComplete',
    cleanCode + '; return { practiceStep, setPracticeState };'
  )(mockGlobals, () => {}, {}, () => {}, () => {}, {}, function(){}, () => {}, () => {}, () => {});

  setPracticeState(true);
  practiceStep(0.016, 1000);

  // Filtered stray enemy, kept training dummy
  assert.equal(mockGlobals.enemies.length, 1);
  assert.equal(mockGlobals.enemies[0].isTrainingDummy, true);
});

test('Dojo refill restores player health and flow without triggering awakening', () => {
  const mockGlobals = {
    player: { x: 400, y: 300 },
    lives: 1,
    maxLives: 3,
    flow: 20,
    flowState: 'normal',
    enhanceActiveTimer: 5,
    enhanceCooldown: 4,
  };

  const { refillDojoResources } = new Function(
    'globals', 'setPracticeStorage', 'safeStorage', 'bindQolButton', 'showToast', 'callbacks', 'TrainingDummy', 'createTutorialSession', 'processLessonEvent', 'isLessonComplete',
    cleanCode + '; return { refillDojoResources };'
  )(mockGlobals, () => {}, {}, () => {}, () => {}, {}, function(){}, () => {}, () => {}, () => {});

  refillDojoResources();

  assert.equal(mockGlobals.lives, 3);
  assert.equal(mockGlobals.flow, 100);
  assert.equal(mockGlobals.flowState, 'normal'); // NOT awakened!
  assert.equal(mockGlobals.enhanceActiveTimer, 0);
  assert.equal(mockGlobals.enhanceCooldown, 0);
});
