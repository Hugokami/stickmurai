const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Skill button borders: uncolored neutral frames without neon borders or glowing rings', () => {
  const css = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf-8');

  // Verify .action-btn has neutral border, not red #bc2c2c
  const actionBtnMatch = css.match(/\.action-btn\s*\{([^}]+)\}/);
  assert.ok(actionBtnMatch, '.action-btn must be defined in style.css');
  assert.doesNotMatch(actionBtnMatch[1], /#bc2c2c/, '.action-btn must not have #bc2c2c border/color');

  // Verify #btn-dash does not use neon cyan border-color (#00d5ed, #00e5ff)
  const dashBlockMatch = css.match(/#btn-dash\s*\{([^}]+)\}/);
  assert.ok(dashBlockMatch, '#btn-dash must be defined');
  assert.doesNotMatch(dashBlockMatch[1], /border-color:\s*#00d5ed/, '#btn-dash must not have neon cyan border-color');
  assert.doesNotMatch(dashBlockMatch[1], /border-color:\s*#00e5ff/, '#btn-dash must not have neon cyan border-color');

  // Verify #btn-enhance does not use neon yellow border-color (#ffd700)
  const enhanceBlockMatch = css.match(/#btn-enhance\s*\{([^}]+)\}/);
  assert.ok(enhanceBlockMatch, '#btn-enhance must be defined');
  assert.doesNotMatch(enhanceBlockMatch[1], /border-color:\s*#ffd700/, '#btn-enhance must not have neon yellow border-color');

  // Verify #btn-stance-switch does not use cyan/sky border (#38bdf8, #00ffff)
  const stanceBlockMatch = css.match(/#btn-stance-switch\s*\{([^}]+)\}/);
  assert.ok(stanceBlockMatch, '#btn-stance-switch must be defined');
  assert.doesNotMatch(stanceBlockMatch[1], /border-color:\s*#38bdf8/, '#btn-stance-switch must not have neon cyan border-color');

  // Verify .ult-action-btn ready states do not have neon colored borders
  const ultReadyMatch = css.match(/#btn-ult-shadow\.ready/);
  assert.ok(ultReadyMatch, '#btn-ult-shadow.ready must exist');
  assert.doesNotMatch(css, /#btn-ult-shadow\.ready\s*\{[^}]*border-color:\s*#c084fc/s, 'ult shadow ready must not have neon purple border');
  assert.doesNotMatch(css, /#btn-ult-omni\.ready\s*\{[^}]*border-color:\s*#ffd700/s, 'ult omni ready must not have neon yellow border');
});

test('Pause button: generic emoji removed and replaced with vector SVG', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

  // Verify no ⏸ emoji in pause-btn
  assert.doesNotMatch(html, /<button[^>]*id="pause-btn"[^>]*>[\s\S]*?⏸[\s\S]*?<\/button>/, 'pause button must not contain generic pause emoji');

  // Verify SVG is present inside pause-btn
  assert.match(html, /<button[^>]*id="pause-btn"[\s\S]*?<svg[\s\S]*?class="hud-pause-svg"/, 'pause button must contain hud-pause-svg');

  const css = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf-8');
  // Invariants required for clickability
  assert.match(css, /#pause-btn,\s*\.hud-pause-btn\s*\{[^}]*pointer-events:\s*auto\s*!important;[^}]*z-index:\s*70;/s, 'pause button must retain clickability invariants');
});
