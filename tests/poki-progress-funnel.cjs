const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const main = fs.readFileSync('src/main.ts', 'utf8');
const ui = fs.readFileSync('src/ui.ts', 'utf8');

test('normal stage clear reports Poki completion before its UI transition', () => {
  const clear = ui.slice(ui.indexOf('export function triggerStageClear()'), ui.indexOf('export function triggerStageClear()') + 500);
  assert.match(clear, /const journeyCompleted = completeJourneyStage\(\);[\s\S]*AdManager\.measure\('level', String\(globals\.currentStage \|\| 1\), 'complete'\);[\s\S]*if \(journeyCompleted\) return;/);
});

test('first-run funnel records menu, first kill and first cleared wave', () => {
  const menu = main.slice(main.indexOf('const proceedToMenu ='), main.indexOf('const proceedToMenu =') + 180);
  const kill = main.slice(main.indexOf('globals.runStats.kills++;'), main.indexOf('globals.runStats.kills++;') + 250);
  const wave = main.slice(main.indexOf('function clearWaveToPortal()'), main.indexOf('function clearWaveToPortal()') + 500);
  assert.match(menu, /AdManager\.measure\('onboarding', 'menu', 'enter'\)/);
  assert.match(kill, /if \(globals\.runStats\.kills === 1[\s\S]*AdManager\.measure\('onboarding', 'first-kill', 'complete'\)/);
  assert.match(wave, /if \(globals\.currentWave === 1[\s\S]*AdManager\.measure\('onboarding', 'first-wave', 'complete'\)/);
});
