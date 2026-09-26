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
    'torigate.webp',
    'stone-lamp.webp',
    'statue.webp'
  ];

  for (const file of requiredAssets) {
    const fullPath = path.join(bgDir, file);
    assert.ok(fs.existsSync(fullPath), `Asset ${file} must exist in public/fantasy_bg/`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 1000, `Asset ${file} must be non-empty (was ${stat.size} bytes)`);
  }

  // 2. Verify bridge and fence are completely removed
  const assetsTs = fs.readFileSync(path.join(root, 'src/assets.ts'), 'utf8');
  assert.match(assetsTs, /export const borderPropImages =/);
  assert.doesNotMatch(assetsTs, /fence\.webp/);
  assert.doesNotMatch(assetsTs, /bridge\.webp/);
  assert.match(assetsTs, /queueAsset\(borderPropImages\.torigate, '\.\/fantasy_bg\/torigate\.webp'/);
  assert.match(assetsTs, /queueAsset\(borderPropImages\.stoneLamp, '\.\/fantasy_bg\/stone-lamp\.webp'/);
  assert.match(assetsTs, /queueAsset\(borderPropImages\.statue, '\.\/fantasy_bg\/statue\.webp'/);

  // 3. Verify borderDecor.ts defines layout and draw function
  const borderDecorTs = fs.readFileSync(path.join(root, 'src/borderDecor.ts'), 'utf8');
  assert.match(borderDecorTs, /export const BORDER_DECORATIONS/);
  assert.match(borderDecorTs, /export function drawBorderDecorations/);
  assert.doesNotMatch(borderDecorTs, /'fence'/);
  assert.doesNotMatch(borderDecorTs, /'bridge'/);

  // 4. Invariant: Every border prop must be strictly INSIDE the arena boundaries
  // Arena: left: -2300, right: 3700, top: -1750, bottom: 2450
  const arenaLeft = -2300;
  const arenaRight = 3700;
  const arenaTop = -1750;
  const arenaBottom = 2450;
  const pad = 50;

  // Extract all items from BORDER_DECORATIONS
  const itemMatches = [...borderDecorTs.matchAll(/\{\s*type:\s*'([^']+)',\s*x:\s*([^,]+),\s*y:\s*([^,]+),\s*w:\s*(\d+),\s*h:\s*(\d+)/g)];
  assert.ok(itemMatches.length > 0, 'Must have at least one border decoration item');

  for (const match of itemMatches) {
    const [, type, xExpr, yExpr, wStr, hStr] = match;
    const w = parseInt(wStr, 10);
    const h = parseInt(hStr, 10);

    // Evaluate x and y expressions safely
    const evalCoord = (expr) => {
      return expr
        .replace(/arena\.left/g, `${arenaLeft}`)
        .replace(/arena\.right/g, `${arenaRight}`)
        .replace(/arena\.top/g, `${arenaTop}`)
        .replace(/arena\.bottom/g, `${arenaBottom}`)
        .replace(/PAD/g, `${pad}`);
    };

    const x = Function(`return (${evalCoord(xExpr)});`)();
    const y = Function(`return (${evalCoord(yExpr)});`)();

    assert.ok(x >= arenaLeft + pad, `Prop ${type} at x=${x} must be >= arena.left + pad (${arenaLeft + pad})`);
    assert.ok(x + w <= arenaRight - pad, `Prop ${type} at x+w=${x + w} must be <= arena.right - pad (${arenaRight - pad})`);
    assert.ok(y >= arenaTop + pad, `Prop ${type} at y=${y} must be >= arena.top + pad (${arenaTop + pad})`);
    assert.ok(y + h <= arenaBottom - pad, `Prop ${type} at y+h=${y + h} must be <= arena.bottom - pad (${arenaBottom - pad})`);
  }

  // 5. Verify renderer.ts calls drawBorderDecorations inside drawBackground
  const rendererTs = fs.readFileSync(path.join(root, 'src/renderer.ts'), 'utf8');
  const bgCode = rendererTs.slice(
    rendererTs.indexOf('export function drawBackground'),
    rendererTs.indexOf('export function resetCanvasVisuals')
  );
  assert.match(bgCode, /drawBorderDecorations\(/);

  // 6. Invariant: zero ctx.filter or ctx.shadowBlur in drawBackground
  assert.doesNotMatch(bgCode, /ctx\.filter\s*=|shadowBlur/);
});
