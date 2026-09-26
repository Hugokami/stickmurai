const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('ground and border decorations asset pipeline and rendering invariants', () => {
  // 1. Verify ground and props files exist in public/fantasy_bg
  const bgDir = path.join(root, 'public/fantasy_bg');
  const requiredAssets = [
    'ground.webp',
    'fence.webp',
    'torigate.webp',
    'stone-lamp.webp',
    'statue.webp',
    'bridge.webp'
  ];

  for (const file of requiredAssets) {
    const fullPath = path.join(bgDir, file);
    assert.ok(fs.existsSync(fullPath), `Asset ${file} must exist in public/fantasy_bg/`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 1000, `Asset ${file} must be non-empty (was ${stat.size} bytes)`);
  }

  // 2. Verify assets.ts exports borderPropImages and queues all 5 props
  const assetsTs = fs.readFileSync(path.join(root, 'src/assets.ts'), 'utf8');
  assert.match(assetsTs, /export const borderPropImages =/);
  assert.match(assetsTs, /queueAsset\(borderPropImages\.fence, '\.\/fantasy_bg\/fence\.webp'/);
  assert.match(assetsTs, /queueAsset\(borderPropImages\.torigate, '\.\/fantasy_bg\/torigate\.webp'/);
  assert.match(assetsTs, /queueAsset\(borderPropImages\.stoneLamp, '\.\/fantasy_bg\/stone-lamp\.webp'/);
  assert.match(assetsTs, /queueAsset\(borderPropImages\.statue, '\.\/fantasy_bg\/statue\.webp'/);
  assert.match(assetsTs, /queueAsset\(borderPropImages\.bridge, '\.\/fantasy_bg\/bridge\.webp'/);

  // 3. Verify borderDecor.ts defines layout and draw function
  const borderDecorTs = fs.readFileSync(path.join(root, 'src/borderDecor.ts'), 'utf8');
  assert.match(borderDecorTs, /export const BORDER_DECORATIONS/);
  assert.match(borderDecorTs, /export function drawBorderDecorations/);

  // 4. Verify renderer.ts calls drawBorderDecorations inside drawBackground
  const rendererTs = fs.readFileSync(path.join(root, 'src/renderer.ts'), 'utf8');
  const bgCode = rendererTs.slice(
    rendererTs.indexOf('export function drawBackground'),
    rendererTs.indexOf('export function resetCanvasVisuals')
  );
  assert.match(bgCode, /drawBorderDecorations\(/);

  // 5. Invariant: zero ctx.filter or ctx.shadowBlur in drawBackground
  assert.doesNotMatch(bgCode, /ctx\.filter\s*=|shadowBlur/);
});
