const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');

const source = stripTypeScriptTypes(fs.readFileSync('src/qolCore.ts', 'utf8'))
  .replace(/^import .*;$/gm, '')
  .replace(/export (const|class|function|let|var|interface|type) /g, '$1 ')
  .replace(/export default /g, '') + '\nmodule.exports = { humanizeString, formatDurationSeconds, formatQuantity };';

const mod = { exports: {} };
new Function('module', source)(mod);
const { humanizeString, formatDurationSeconds, formatQuantity } = mod.exports;

test('humanize helpers format strings, durations, and counts cleanly', () => {
  assert.equal(humanizeString('total_amount_due'), 'Total amount due');
  assert.equal(humanizeString('user_profile_status'), 'User profile status');
  assert.equal(humanizeString('__secret_code__'), 'Secret code');
  assert.equal(humanizeString('katana-slash-damage'), 'Katana slash damage');

  assert.equal(formatDurationSeconds(45), '45s');
  assert.equal(formatDurationSeconds(125), '2m 5s');
  assert.equal(formatDurationSeconds(3665), '1h 1m');

  assert.equal(formatQuantity(0, 'case'), '0 cases');
  assert.equal(formatQuantity(1, 'case'), '1 case');
  assert.equal(formatQuantity(5, 'case'), '5 cases');
  assert.equal(formatQuantity(1, 'enemy', 'enemies'), '1 enemy');
  assert.equal(formatQuantity(3, 'enemy', 'enemies'), '3 enemies');
});
