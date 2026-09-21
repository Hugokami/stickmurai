const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');

const source = stripTypeScriptTypes(fs.readFileSync('src/tutorialCore.ts', 'utf8'));
const {
  lessons,
  nextLesson,
  createTutorialSession,
  processLessonEvent,
  isLessonComplete,
} = new Function(
  source.replace(/export /g, '') + '; return { lessons, nextLesson, createTutorialSession, processLessonEvent, isLessonComplete };'
)();

test('only current lesson advances; complete stays complete', () => {
  let state = 'move';
  assert.equal(nextLesson(state, 'parry'), 'move');
  for (const lesson of lessons) state = nextLesson(state, lesson);
  assert.equal(state, 'complete');
  assert.equal(nextLesson('complete', 'move'), 'complete');
});

test('lessons list contains exactly the 11 course lessons in required order', () => {
  assert.deepEqual(lessons, [
    'move', 'slash', 'skill', 'awakening', 'dash', 'iaijutsu',
    'dodge', 'parry', 'dash-slash', 'charge-dash', 'shop'
  ]);
});

test('tutorial session rejects old session IDs and stale event sequences', () => {
  let session = createTutorialSession(1);
  assert.equal(session.currentLesson, 'move');

  // Wrong session ID
  let res = processLessonEvent(session, { sessionId: 99, seq: 1, type: 'move', distMoved: 120, distToMarker: 10 });
  assert.equal(res.advanced, false);
  assert.equal(session.currentLesson, 'move');

  // Stale sequence
  res = processLessonEvent(session, { sessionId: 1, seq: 0, type: 'move', distMoved: 120, distToMarker: 10 });
  assert.equal(res.advanced, false);
  assert.equal(session.currentLesson, 'move');
});

test('lesson 1: move requires distance >= 100 and inside radius 24', () => {
  let session = createTutorialSession(1);
  // Not inside marker
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'move', distMoved: 120, distToMarker: 40 });
  assert.equal(res.advanced, false);
  // Inside marker but not enough distance moved (e.g. teleport or spawned close)
  res = processLessonEvent(session, { sessionId: 1, seq: 2, type: 'move', distMoved: 50, distToMarker: 10 });
  assert.equal(res.advanced, false);
  // Both met
  res = processLessonEvent(session, { sessionId: 1, seq: 3, type: 'move', distMoved: 110, distToMarker: 15 });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'slash');
});

test('lesson 2: slash requires 1 basic slash hit to advance', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'slash';

  // Miss (did not hit dummy)
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'slash', attackId: 101, hitDummy: false });
  assert.equal(res.advanced, false);
  assert.equal(res.session.slashHits, 0);

  // Hit 1 -> advances immediately
  res = processLessonEvent(res.session, { sessionId: 1, seq: 2, type: 'slash', attackId: 102, hitDummy: true });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'skill');
});

test('lesson 3: skill requires actual skill effect (damage dummy or buff applied)', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'skill';

  // Inactive / failed cast
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'skill', activated: false });
  assert.equal(res.advanced, false);

  // Damaging skill hits dummy
  res = processLessonEvent(session, { sessionId: 1, seq: 2, type: 'skill', activated: true, hitDummy: true });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'awakening');

  // Support skill without damaging dummy also qualifies
  session.currentLesson = 'skill';
  res = processLessonEvent(session, { sessionId: 1, seq: 3, type: 'skill', activated: true, isSupport: true });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'awakening');
});

test('lesson 4: awakening advances on manual player input', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'awakening';

  // Activation with any ultimate payload advances
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'awakening', manualInput: true, ultType: 'shadow' });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'dash');
});

test('lesson 5: dash requires 1 genuine dash with >= 50 units movement', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'dash';

  // Dash too short (< 50 units)
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'dash', dashDist: 30 });
  assert.equal(res.advanced, false);
  assert.equal(res.session.dashCount, 0);

  // Dash 1 >= 50 -> advances immediately
  res = processLessonEvent(res.session, { sessionId: 1, seq: 2, type: 'dash', dashDist: 80 });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'iaijutsu');
});

test('lesson 6: iaijutsu requires fully charged release hitting dummy', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'iaijutsu';

  // Early release
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'iaijutsu', fullyCharged: false, hitDummy: true });
  assert.equal(res.advanced, false);

  // Fully charged but missed
  res = processLessonEvent(session, { sessionId: 1, seq: 2, type: 'iaijutsu', fullyCharged: true, hitDummy: false });
  assert.equal(res.advanced, false);

  // Fully charged and hit dummy
  res = processLessonEvent(session, { sessionId: 1, seq: 3, type: 'iaijutsu', fullyCharged: true, hitDummy: true });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'dodge');
});

test('lesson 7: dodge requires 1 perfect dodge against dummy', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'dodge';

  // Not from dummy
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'dodge', perfectDodge: true, fromDummy: false });
  assert.equal(res.advanced, false);
  assert.equal(res.session.dodgeSuccesses, 0);

  // Success 1 against dummy -> advances immediately
  res = processLessonEvent(res.session, { sessionId: 1, seq: 2, type: 'dodge', perfectDodge: true, fromDummy: true });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'parry');
});

test('lesson 8: parry requires 1 perfect parry against dummy', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'parry';

  // Not from dummy
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'parry', perfectParry: true, fromDummy: false });
  assert.equal(res.advanced, false);
  assert.equal(res.session.parrySuccesses, 0);

  // Success 1 against dummy -> advances immediately
  res = processLessonEvent(res.session, { sessionId: 1, seq: 2, type: 'parry', perfectParry: true, fromDummy: true });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'dash-slash');
});

test('lesson 9: dash-slash requires basic slash hitting dummy within 600ms of dash start', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'dash-slash';

  // Slashed too late (> 600ms)
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'dash-slash', hitDummy: true, timeSinceDashMs: 650 });
  assert.equal(res.advanced, false);

  // Slashed within 600ms but missed
  res = processLessonEvent(session, { sessionId: 1, seq: 2, type: 'dash-slash', hitDummy: false, timeSinceDashMs: 300 });
  assert.equal(res.advanced, false);

  // Slashed within 600ms and hit dummy
  res = processLessonEvent(session, { sessionId: 1, seq: 3, type: 'dash-slash', hitDummy: true, timeSinceDashMs: 400 });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'charge-dash');
});

test('lesson 10: charge-dash requires full charge consumed by dash and strike hits dummy', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'charge-dash';

  // Not from charge dash
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'charge-dash', fromChargeDash: false, hitDummy: true });
  assert.equal(res.advanced, false);

  // From charge dash but missed
  res = processLessonEvent(session, { sessionId: 1, seq: 2, type: 'charge-dash', fromChargeDash: true, hitDummy: false });
  assert.equal(res.advanced, false);

  // Correct
  res = processLessonEvent(session, { sessionId: 1, seq: 3, type: 'charge-dash', fromChargeDash: true, hitDummy: true });
  assert.equal(res.advanced, true);
  assert.equal(res.session.currentLesson, 'shop');
});

test('lesson 11: shop requires purchase to complete tutorial', () => {
  let session = createTutorialSession(1);
  session.currentLesson = 'shop';

  // Attack without purchase fails
  let res = processLessonEvent(session, { sessionId: 1, seq: 1, type: 'shop', phase: 'attack', hitDummy: true });
  assert.equal(res.advanced, false);

  // Purchase step completes tutorial
  res = processLessonEvent(session, { sessionId: 1, seq: 2, type: 'shop', phase: 'buy', powerupId: 'puSlashName' });
  assert.equal(res.advanced, true);
  assert.equal(res.session.shopPurchased, true);
  assert.equal(res.session.currentLesson, 'complete');
  assert.equal(isLessonComplete(res.session), true);
});
