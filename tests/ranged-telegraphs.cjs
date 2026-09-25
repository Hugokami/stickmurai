const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { stripTypeScriptTypes } = require('node:module');

// Execute real Enemy/Entity/Projectile code; only browser assets/audio are stubbed.
function load(name, imports) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', name + '.ts'), 'utf8');
  const stripped = stripTypeScriptTypes(source);
  const names = [...stripped.matchAll(/export (?:class|function|const) (\w+)/g)].map(m => m[1]);
  const code = stripped.replace(/import [^;]+;/g, '').replace(/export /g, '');
  const bindings = Object.assign({}, ...Object.values(imports));
  return new Function(...Object.keys(bindings), code + `; return { ${names.join(',')} };`)(...Object.values(bindings));
}
const noop = () => {};
const globals = {};
const assets = { anims: new Proxy({}, { get: () => ({ idle: [] }) }), vfxAnims: { fireMage: {}, frostKnight: {}, starcaller: {}, warlock: {} }, loadEnemyAssetsNow: noop };
const callbacks = { checkPlayerHit: noop };
const entities = load('entities', { './globals': { globals }, './assets': assets, './callbacks': { callbacks } });
const { Enemy } = load('enemy', {
  './globals': { globals }, './balance': load('balance', {}), './callbacks': { callbacks }, './entities': entities,
  './audio': { playEnergyBeam: noop }, './assets': assets, './pvpIaijutsuManager': { pvpManager: {} },
  './combatPolish': { isBoss: e => e.isBoss || e.subType === 'oni_boss' || e.subType === 'shogun_boss' || e.subType === 'agis_colossus' || e.subType === 'skeleton_warlord' }, './bosses': { isBossType: () => false },
});
const rangedTypes = ['musketeer', 'shadow_sniper', 'tengu_sorcerer', 'corrupted_shaman', 'pyromancer', 'glacial_sentinel', 'astromancer', 'necromancer', 'toaster_bot'];
function enemy(type) {
  Object.assign(globals, { gameMode: 'classic', currentStage: 1, currentWave: 1, totalWaves: 3, stageBossSpawned: true,
    enemies: [], projectiles: [], delayedActions: [], animatedEffects: [], particles: [], decoys: [], floatingTexts: [],
    playerStats: {}, vw: 1600, vh: 1000, activeStageAffix: null, player: { x: 600, y: 200, state: 'idle' } });
  const e = new Enemy(0, 0, globals.player);
  e.subType = type;
  e.configureSubType();
  e.attackCooldownTimer = 0;
  if (type === 'glacial_sentinel') Object.assign(globals.player, { x: 180, y: 0 });
  e.update(0); // Enter charge through real state machine.
  return e;
}
function record(e) {
  const draws = [];
  let state = { x: 0, y: 0, angle: 0, strokeStyle: '', lineWidth: 1 }, current = [];
  const stack = [];
  const point = (x, y) => [state.x + x * Math.cos(state.angle) - y * Math.sin(state.angle), state.y + x * Math.sin(state.angle) + y * Math.cos(state.angle)];
  const ctx = new Proxy({
    save() { stack.push({ ...state }); }, restore() { state = stack.pop(); },
    translate(x, y) { [state.x, state.y] = point(x, y); }, rotate(a) { state.angle += a; },
    beginPath() { current = []; },
    moveTo(x, y) { current.push(['moveTo', ...point(x, y)]); }, lineTo(x, y) { current.push(['lineTo', ...point(x, y)]); },
    arc(x, y, ...rest) { current.push(['arc', ...point(x, y), ...rest]); },
    ellipse(x, y, ...rest) { current.push(['ellipse', ...point(x, y), ...rest]); },
    stroke() { draws.push({ ...state, path: [...current] }); },
  }, { get: (obj, key) => key in obj ? obj[key] : state[key] ?? noop,
    set(_obj, key, value) { assert.ok(key !== 'filter' && key !== 'shadowBlur'); state[key] = value; return true; } });
  e.draw(ctx, globals.vw / 2, globals.vh / 2);
  return draws;
}

function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} != ${expected}`);
}
function corridors(e) {
  return record(e).filter(d => d.lineWidth >= 12 && d.path.length === 2 && d.path[0][0] === 'moveTo');
}
function stepTo(e, ratio) { e.update(e.chargeTimeMax * ratio - e.stateTime); }
function fixedRandom(value, run) {
  const random = Math.random;
  Math.random = () => value;
  try { return run(); } finally { Math.random = random; }
}

for (const type of ['musketeer', 'shadow_sniper', 'tengu_sorcerer', 'corrupted_shaman', 'pyromancer', 'necromancer', 'toaster_bot']) {
  test(`${type}: moving target, locked corridor, projectile origin and velocity agree`, () => {
    const e = enemy(type);
    const originY = type === 'toaster_bot' ? -16 : type === 'necromancer' ? -20 : 0;
    const target = { x: 450, y: 320 };
    Object.assign(globals.player, target);
    stepTo(e, 0.5);
    close(e.targetAngle, Math.atan2(target.y - originY, target.x), 'tracking from muzzle');
    assert.equal(e.isAimLocked, false);
    const tracked = e.targetAngle;
    Object.assign(globals.player, { x: -500, y: -200 });
    stepTo(e, 0.7);
    assert.equal(e.isAimLocked, true);
    close(e.targetAngle, tracked, 'aim holds after 65%');
    const beams = corridors(e);
    assert.equal(beams.length, type === 'tengu_sorcerer' ? 2 : 1, 'one corridor per fired trajectory');
    for (const beam of beams) {
      close(beam.path[0][1], e.x, 'corridor origin x');
      close(beam.path[0][2], originY, 'corridor origin y');
      assert.match(beam.strokeStyle, /239, 68, 68/, 'locked beam red');
    }
    fixedRandom(type === 'pyromancer' ? 0 : 0.9, () => stepTo(e, 1.01));
    e.update(0.33);
    for (const action of globals.delayedActions.splice(0)) action.run();
    assert.ok(globals.projectiles.length > 0);
    for (const projectile of globals.projectiles) {
      const matching = beams.some(beam => {
        const [, x, y] = beam.path[0];
        const [, tx, ty] = beam.path[1];
        return Math.abs(Math.atan2(ty - y, tx - x) - projectile.angle) < 1e-8 && x === projectile.x && y === projectile.y;
      });
      assert.ok(matching, 'actual projectile must follow displayed corridor');
    }
  });
}

for (const type of rangedTypes) {
  test(`${type}: charging has directional warning, no enemy-centered circular warning`, () => {
    const e = enemy(type);
    const draws = record(e);
    assert.ok(draws.some(d => d.path.some(p => p[0] === 'lineTo')), 'directional warning present');
    assert.equal(draws.filter(d => d.path.some(p => p[0] === 'ellipse' || p[0] === 'arc')).length, 0,
      'ranged charge must not stroke stationary enemy aura/attack circles');
  });
}

test('melee grunt: directional attack capsule matching hit radius with lunge arc', () => {
  globals.player = { x: 50, y: 50, state: 'idle' };
  const e = enemy('grunt');
  Object.assign(globals.player, { x: 50, y: 50 });
  e.attackCooldownTimer = 0;
  e.update(0);
  assert.equal(e.state, 'charge');
  const draws = record(e);
  assert.ok(draws.some(d => d.path.some(p => p[0] === 'arc')), 'melee charging keeps lunge capsule arc');
  assert.ok(draws.some(d => d.path.some(p => p[0] === 'lineTo')), 'melee directional centerline present');
  assert.equal(draws.filter(d => d.path.some(p => p[0] === 'ellipse')).length, 0,
    'melee charging must not stroke stationary aura rings');
});

test('boss: directional strike capsule rotated toward target with boss hit radius', () => {
  globals.player = { x: 80, y: 40, state: 'idle' };
  const e = enemy('skeleton_warlord');
  Object.assign(globals.player, { x: 80, y: 40 });
  e.state = 'idle';
  e.attackCooldownTimer = 0;
  e.update(0);
  assert.equal(e.state, 'charge');
  const draws = record(e);
  assert.ok(draws.some(d => d.path.some(p => p[0] === 'arc')), 'boss strike telegraph has capsule arc');
  assert.ok(draws.some(d => d.path.some(p => p[0] === 'lineTo')), 'boss directional centerline present');
  assert.equal(draws.filter(d => d.path.some(p => p[0] === 'ellipse')).length, 0,
    'boss charging must not stroke stationary aura rings');
});

test('detonator: melee enemy with circular detonation telegraph centered on enemy, moves toward player', () => {
  globals.player = { x: 100, y: 0, state: 'idle' };
  const e = enemy('detonator');
  assert.equal(e.isRanged(), false, 'detonator is melee enemy');
  assert.equal(e.type, 'detonator', 'detonator uses detonator sprite');
  
  // Test walk movement towards player
  e.x = 0; e.y = 0;
  globals.player.x = 300; globals.player.y = 0;
  e.update(0.016);
  assert.ok(e.vx > 0, 'detonator moves toward player on X');
  
  // Test charge state and circular telegraph
  globals.player.x = 100; globals.player.y = 0;
  e.state = 'charge';
  e.stateTime = 0.5;
  e.update(0.016);
  assert.ok(e.vx > 0, 'detonator keeps moving toward player even while charging');

  const draws = record(e);
  const arcs = draws.filter(d => d.path.some(p => p[0] === 'arc'));
  assert.ok(arcs.length >= 2, 'detonator has circular outer boundary and inner expanding charge ring');
  const fullCircle = arcs.find(d => d.path.some(p => p[0] === 'arc' && Math.abs(p[3] - 190) < 5));
  assert.ok(fullCircle, 'outer circle matches 190px explosion radius');
});

