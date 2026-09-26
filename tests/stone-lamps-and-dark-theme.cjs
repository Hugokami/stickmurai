const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('Stone lamps & dark battlefield theme invariants', async (t) => {
  const borderDecorTs = fs.readFileSync(path.join(root, 'src', 'borderDecor.ts'), 'utf8');
  const rendererTs = fs.readFileSync(path.join(root, 'src', 'renderer.ts'), 'utf8');
  const playerTs = fs.readFileSync(path.join(root, 'src', 'player.ts'), 'utf8');
  const mainTs = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');

  await t.test('1. Battlefield theme is darkened with ambient overlay in drawBackground', () => {
    assert.match(rendererTs, /rgba\(4,\s*7,\s*9,\s*0\.65\)|rgba\(\d+,\s*\d+,\s*\d+,\s*0\.[5-9]\d*\)/, 'Ambient darkening overlay must be drawn');
    const bgCode = rendererTs.slice(
      rendererTs.indexOf('export function drawBackground'),
      rendererTs.indexOf('export function resetCanvasVisuals')
    );
    assert.match(bgCode, /ctx\.fillRect\(arena\.left,\s*arena\.top,\s*width,\s*height\);[\s\S]*ctx\.fillRect\(arena\.left,\s*arena\.top,\s*width,\s*height\);/, 'Dark overlay covers full arena');
  });

  await t.test('2. Bright radial lighting halos drawn around stone lamps', () => {
    const bgCode = rendererTs.slice(
      rendererTs.indexOf('export function drawBackground'),
      rendererTs.indexOf('export function resetCanvasVisuals')
    );
    assert.match(bgCode, /ctx\.globalCompositeOperation\s*=\s*'lighter'/, 'Additive blending used for lantern halos');
    assert.match(bgCode, /createRadialGradient\(/, 'Radial gradients generate bright lantern lighting');
    assert.match(bgCode, /STONE_LAMP_OBSTACLES/, 'Iterates stone lamp positions for lighting');
  });

  await t.test('3. Stone lamps are smaller than previous 80x108 footprint', () => {
    const lampMatches = [...borderDecorTs.matchAll(/\{\s*type:\s*'stoneLamp',\s*x:\s*([^,]+),\s*y:\s*([^,]+),\s*w:\s*(\d+),\s*h:\s*(\d+)/g)];
    assert.ok(lampMatches.length >= 20, `Must have >= 20 stone lamps, found ${lampMatches.length}`);
    for (const match of lampMatches) {
      const w = parseInt(match[3], 10);
      const h = parseInt(match[4], 10);
      assert.ok(w <= 55, `Width ${w} must be smaller than original 80px`);
      assert.ok(h <= 75, `Height ${h} must be smaller than original 108px`);
    }
  });

  await t.test('4. Stone lamps are scattered uniformly across the battlefield (interior and borders)', () => {
    const lampMatches = [...borderDecorTs.matchAll(/\{\s*type:\s*'stoneLamp',\s*x:\s*([-\d]+),\s*y:\s*([-\d]+),\s*w:\s*(\d+),\s*h:\s*(\d+)/g)];
    const xs = lampMatches.map(m => parseInt(m[1], 10));
    const ys = lampMatches.map(m => parseInt(m[2], 10));

    // Must span wide horizontal and vertical range across arena
    assert.ok(Math.min(...xs) <= -1800, 'Lamps must reach west sector');
    assert.ok(Math.max(...xs) >= 3300, 'Lamps must reach east sector');
    assert.ok(Math.min(...ys) <= -1400, 'Lamps must reach north sector');
    assert.ok(Math.max(...ys) >= 1800, 'Lamps must reach south sector');

    // Must have lamps in arena interior (not just border edges)
    const interiorLamps = lampMatches.filter(m => {
      const x = parseInt(m[1], 10);
      const y = parseInt(m[2], 10);
      return x > -1500 && x < 2500 && y > -1000 && y < 1500;
    });
    assert.ok(interiorLamps.length >= 10, `Must have >= 10 interior lamps, found ${interiorLamps.length}`);
  });

  await t.test('5. Impassable collision logic resolves penetrations and prevents passing through', () => {
    assert.match(borderDecorTs, /export const STONE_LAMP_OBSTACLES/, 'Exports stone lamp obstacles');
    assert.match(borderDecorTs, /export function resolveStoneLampCollisions/, 'Exports collision resolver');

    // Evaluate collision function in sandboxed scope with arena
    const { stripTypeScriptTypes } = require('node:module');
    const arenaSource = fs.readFileSync(path.join(root, 'src', 'arena.ts'), 'utf8');
    const arenaCode = stripTypeScriptTypes(arenaSource).replace(/export /g, '');
    const borderDecorCode = stripTypeScriptTypes(borderDecorTs)
      .replace(/import [^;]+;/g, '')
      .replace(/export /g, '');

    const sandbox = new Function(`
      ${arenaCode}
      const borderPropImages = {};
      ${borderDecorCode}
      return { resolveStoneLampCollisions, STONE_LAMP_OBSTACLES };
    `)();

    const { resolveStoneLampCollisions, STONE_LAMP_OBSTACLES } = sandbox;
    assert.ok(STONE_LAMP_OBSTACLES.length >= 20, 'STONE_LAMP_OBSTACLES populated');

    const testLamp = STONE_LAMP_OBSTACLES[0];
    const actor = { x: testLamp.x + 5, y: testLamp.y, vx: -100, vy: 0 };
    const initialDist = Math.hypot(actor.x - testLamp.x, actor.y - testLamp.y);
    assert.ok(initialDist < 22 + testLamp.radius, 'Initial actor overlaps lamp');

    const collided = resolveStoneLampCollisions(actor, 22);
    assert.strictEqual(collided, true, 'Reports collision');

    const finalDist = Math.hypot(actor.x - testLamp.x, actor.y - testLamp.y);
    assert.ok(finalDist >= 22 + testLamp.radius - 0.01, `Pushed outside collision circle: ${finalDist} >= ${22 + testLamp.radius}`);
    assert.ok(actor.vx >= 0, 'Velocity towards lamp canceled/reflected');
  });

  await t.test('6. Collision resolver wired into player and main game loop', () => {
    assert.match(playerTs, /resolveStoneLampCollisions/, 'Player updates resolve stone lamp collisions');
    assert.match(mainTs, /resolveStoneLampCollisions\(globals\.player/, 'Main loop resolves player lamp collisions');
    assert.match(mainTs, /resolveStoneLampCollisions\(enemy/, 'Main loop resolves enemy lamp collisions');
  });
});
