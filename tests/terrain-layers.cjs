const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('terrain layers load in reference order and stay world anchored inside arena', () => {
  const assets = fs.readFileSync(path.join(root, 'src/assets.ts'), 'utf8');
  const renderer = fs.readFileSync(path.join(root, 'src/renderer.ts'), 'utf8');
  const background = renderer.slice(renderer.indexOf('export function drawBackground'), renderer.indexOf('export function resetCanvasVisuals'));
  for (const name of ['ground', 'ground-dirt', 'stones', 'leaves']) {
    assert.match(assets, /fantasy_bg\/\$\{name\}\.webp/);
    assert.ok(fs.existsSync(path.join(root, `public/fantasy_bg/${name}.webp`)));
  }
  assert.match(assets, /\['ground', 'ground-dirt', 'stones', 'leaves'\]/);
  assert.match(background, /ctx\.translate\(globals\.vw \/ 2 - globals\.camera\.x, globals\.vh \/ 2 - globals\.camera\.y\)/);
  assert.match(background, /ctx\.fillRect\(arena\.left, arena\.top, width, height\)/);
  assert.match(renderer, /createPattern\(.*'repeat'\)/);
  assert.doesNotMatch(background, /ctx\.filter\s*=|shadowBlur/);
});
