const { test } = require('node:test');
const assert = require('node:assert/strict');
const { arena, clampToArena } = require('../src/arena.ts');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const renderer = readFileSync(join(__dirname, '../src/renderer.ts'), 'utf8');
const main = readFileSync(join(__dirname, '../src/main.ts'), 'utf8');

test('arena floor and markings share world coordinates with moving camera', () => {
  const background = renderer.slice(renderer.indexOf('export function drawBackground'), renderer.indexOf('export function resetCanvasVisuals'));
  assert.ok(background.includes('ctx.translate(globals.vw / 2 - globals.camera.x, globals.vh / 2 - globals.camera.y)'));
  assert.ok(background.includes('terrainPattern'));
  assert.ok(background.includes('arena.left') && background.includes('arena.right'));
});

test('battle update constrains player and enemies after movement', () => {
  assert.ok(main.includes('globals.player.update(realDt);\n  clampToArena(globals.player);') || main.includes('globals.player.update(realDt);\r\n  clampToArena(globals.player);'));
  assert.ok(main.includes('for (const enemy of globals.enemies) clampToArena(enemy)'));
});


test('arena surrounds spawn and leaves space for enemy spawning', () => {
  assert.ok(arena.left < 700 - 1200 && arena.right > 700 + 1200);
  assert.ok(arena.top < 350 - 1200 && arena.bottom > 350 + 1200);
});

test('player and enemies stop at each battlefield edge', () => {
  const actor = { x: arena.right + 800, y: arena.top - 100 };
  clampToArena(actor);
  assert.deepEqual(actor, { x: arena.right - 48, y: arena.top + 48 });
  actor.x = arena.left - 300;
  actor.y = arena.bottom + 300;
  clampToArena(actor);
  assert.deepEqual(actor, { x: arena.left + 48, y: arena.bottom - 48 });
});

test('positions within arena remain untouched', () => {
  const actor = { x: 700, y: 350 };
  clampToArena(actor);
  assert.deepEqual(actor, { x: 700, y: 350 });
});
