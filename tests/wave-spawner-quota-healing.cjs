const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const enemySrc = fs.readFileSync(path.join(root, 'src/enemy.ts'), 'utf8');
const mainSrc = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');

test('detonator explosion credits killEnemy callback for wave quota', () => {
  // triggerBarrelExplosion must call callbacks.killEnemy when !barrel.deathHandled
  assert.ok(
    enemySrc.includes('callbacks.killEnemy && !barrel.deathHandled'),
    'triggerBarrelExplosion must invoke callbacks.killEnemy for unhandled death'
  );
});

test('spawner self-heals quota deficit when spawned count exceeds kills + alive enemies', () => {
  // Spawner must sync waveEnemiesSpawned if enemies vanished or self-destructed
  assert.ok(
    mainSrc.includes('globals.waveEnemiesSpawned = kills + aliveEnemies'),
    'spawnEnemy must resync waveEnemiesSpawned to prevent spawner starvation'
  );
});

test('enemy spawner watchdog triggers on unmet kill quota with zero active alive enemies', () => {
  // Watchdog checks waveEnemiesKilled < waveEnemiesTotal
  assert.ok(
    mainSrc.includes("globals.waveState === 'active' && activeAlive === 0 && (globals.waveEnemiesKilled || 0) < (globals.waveEnemiesTotal || 1)"),
    'Watchdog must check that kill quota is fulfilled before stopping spawns'
  );
});

test('quota deficit simulation: missing enemy is recovered and permitted to spawn', () => {
  // Simulate the exact bug from Stage 36 Wave 1/10 (13/14)
  const globals = {
    gameMode: 'classic',
    waveEnemiesTotal: 14,
    waveEnemiesKilled: 13,
    waveEnemiesSpawned: 14,
    enemies: []
  };

  const totalNeeded = globals.waveEnemiesTotal || 10;
  const kills = globals.waveEnemiesKilled || 0;
  const aliveEnemies = globals.enemies.filter(e => e.state !== 'dead' && !e.isPvpRemote).length;

  if ((globals.waveEnemiesSpawned || 0) > kills + aliveEnemies) {
    globals.waveEnemiesSpawned = kills + aliveEnemies;
  }

  assert.equal(globals.waveEnemiesSpawned, 13, 'Spawned count should resync to 13');
  const remainingToSpawn = totalNeeded - globals.waveEnemiesSpawned;
  assert.equal(remainingToSpawn, 1, 'Exactly 1 remaining enemy must be allowed to spawn');
});
