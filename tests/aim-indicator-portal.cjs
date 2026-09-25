const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const rendererSrc = fs.readFileSync(path.join(root, 'src/renderer.ts'), 'utf8');
const mainSrc = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');

test('aiming arrow stems from middle of player character rather than head', () => {
  // Must use getPlayerAimOrigin or torso-centered offset instead of bare head / -10 offset
  assert.match(rendererSrc, /function getPlayerAimOrigin\(/, 'Renderer must define getPlayerAimOrigin helper');
  assert.match(rendererSrc, /getPlayerAimOrigin\(globals\.player\)/, 'Aiming previews must query player aim origin');
  assert.doesNotMatch(rendererSrc, /py = globals\.player\.y - globals\.camera\.y \+ globals\.vh\/2 - 10;/, 'Old head-stemming py - 10 offset must be removed');
});

test('aim indicators use precise widened indicator with aerodynamic terminus and rails', () => {
  assert.match(rendererSrc, /drawPreciseWidenedAimIndicator\(/, 'Renderer must implement precise widened aim indicator');
  assert.match(rendererSrc, /drawAimCompass/, 'Renderer preserves compass compatibility for test suite');
  assert.match(rendererSrc, /drawAimReticle/, 'Renderer preserves reticle compatibility for test suite');
  assert.doesNotMatch(rendererSrc, /ctx\.shadowBlur\s*=\s*[1-9]/, 'No shadowBlur permitted in frame rendering');
});

test('portal is rendered significantly larger (256px) with visual guidance trail and immediate near activation', () => {
  // Portal size 256x256
  assert.match(rendererSrc, /portalSize\s*=\s*256|256,\s*256/, 'Portal destination size must be 256x256');
  // Visual guidance to portal
  assert.match(rendererSrc, /PORTAL/, 'Renderer must provide portal guidance / badge');
  // Immediate near activation
  assert.match(mainSrc, /165\s*\*\s*165|160\s*\*\s*160/, 'Portal activation distance must trigger near the enlarged portal perimeter');
});
