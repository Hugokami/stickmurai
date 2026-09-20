const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Ranged Enemy Scale Invariants: toaster_bot scale, head offset, and foot alignment', async (t) => {
  const rootDir = path.join(__dirname, '..');
  const entitiesSrc = fs.readFileSync(path.join(rootDir, 'src', 'entities.ts'), 'utf8');
  const enemySrc = fs.readFileSync(path.join(rootDir, 'src', 'enemy.ts'), 'utf8');
  const rendererSrc = fs.readFileSync(path.join(rootDir, 'src', 'renderer.ts'), 'utf8');

  await t.test('entities.ts scales toaster_bot up to match standard enemy presence (scale >= 7.0)', () => {
    const match = entitiesSrc.match(/this\.type\s*===\s*'toaster_bot'\)\s*\{\s*scale\s*\*=\s*([0-9.]+);/);
    assert.ok(match, 'toaster_bot scale block must exist in entities.ts');
    const scale = parseFloat(match[1]);
    assert.ok(scale >= 7.0, `toaster_bot scale (${scale}) must be >= 7.0`);
  });

  await t.test('enemy.ts elevates toaster_bot headOffset to prevent HP bar head clipping (headOffset >= 50)', () => {
    const match = enemySrc.match(/this\.type\s*===\s*'toaster_bot'\)\s*headOffset\s*=\s*([0-9]+);/);
    assert.ok(match, 'toaster_bot headOffset block must exist in enemy.ts');
    const headOffset = parseInt(match[1], 10);
    assert.ok(headOffset >= 50, `toaster_bot headOffset (${headOffset}) must be >= 50`);
  });

  await t.test('enemy.ts anchors footOffsetY for toaster_bot shadow ground alignment (footOffsetY >= 40)', () => {
    const match = enemySrc.match(/this\.type\s*===\s*'toaster_bot'\s*\?\s*([0-9]+)/);
    assert.ok(match, 'toaster_bot footOffsetY ternary must exist in enemy.ts');
    const footOffset = parseInt(match[1], 10);
    assert.ok(footOffset >= 40, `toaster_bot footOffsetY (${footOffset}) must be >= 40`);
  });

  await t.test('renderer.ts baseFoot aligns Y-sorting depth for toaster_bot (baseFoot >= 40)', () => {
    const match = rendererSrc.match(/case\s*'toaster_bot':\s*baseFoot\s*=\s*([0-9]+);/);
    assert.ok(match, 'toaster_bot baseFoot case must exist in renderer.ts');
    const baseFoot = parseInt(match[1], 10);
    assert.ok(baseFoot >= 40, `toaster_bot baseFoot (${baseFoot}) must be >= 40`);
  });

  await t.test('enemy.ts muzzle projectile origin is elevated to match enlarged chassis', () => {
    assert.match(enemySrc, /Projectile\.acquire\(this\.x,\s*this\.y\s*-\s*16/, 'toaster_bot projectile origin should fire at this.y - 16');
  });
});
