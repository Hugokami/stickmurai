const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('CrazyGames SDK and references cleanly purged from core systems', () => {
  const adManagerSrc = fs.readFileSync('src/adManager.ts', 'utf8');
  assert.equal(/crazygames/i.test(adManagerSrc), false, 'src/adManager.ts must have zero CrazyGames references');
  assert.equal(/cgSdk/.test(adManagerSrc), false, 'src/adManager.ts must have zero cgSdk references');

  const audioSrc = fs.readFileSync('src/audio.ts', 'utf8');
  assert.equal(/initCgAudioListener/.test(audioSrc), false, 'src/audio.ts must not have CrazyGames audio listener');

  const storageSrc = fs.readFileSync('src/storage.ts', 'utf8');
  assert.equal(/CrazyGames/.test(storageSrc), false, 'src/storage.ts must not have CrazyGames data references');

  const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.equal(pkgJson.scripts['package:crazygames'], undefined, 'package.json must not have package:crazygames script');
});

test('src/bosses/ modules properly extracted and typed', () => {
  const bossesDir = path.resolve('src/bosses');
  assert.ok(fs.existsSync(bossesDir), 'src/bosses directory must exist');
  
  const requiredFiles = ['types.ts', 'oni.ts', 'shogun.ts', 'colossus.ts', 'warlord.ts', 'index.ts'];
  for (const file of requiredFiles) {
    const filePath = path.join(bossesDir, file);
    assert.ok(fs.existsSync(filePath), `src/bosses/${file} must exist`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.length > 50, `src/bosses/${file} must have valid content`);
  }

  const indexContent = fs.readFileSync(path.join(bossesDir, 'index.ts'), 'utf8');
  assert.match(indexContent, /isBossType/, 'src/bosses/index.ts must export isBossType');
  assert.match(indexContent, /configureBoss/, 'src/bosses/index.ts must export configureBoss');
  assert.match(indexContent, /castBossSpell/, 'src/bosses/index.ts must export castBossSpell');
  assert.match(indexContent, /triggerBossAttack/, 'src/bosses/index.ts must export triggerBossAttack');
  assert.match(indexContent, /handleBossHit/, 'src/bosses/index.ts must export handleBossHit');
});

test('src/collision.ts implements pure collision math and corridor tests', () => {
  const collisionSrc = fs.readFileSync('src/collision.ts', 'utf8');
  assert.match(collisionSrc, /export function distToSegment/, 'must export distToSegment');
  assert.match(collisionSrc, /export function pointInCircle/, 'must export pointInCircle');
  assert.match(collisionSrc, /export function circleIntersectsSegment/, 'must export circleIntersectsSegment');
  assert.match(collisionSrc, /export function checkLineIntersection/, 'must export checkLineIntersection');
  assert.match(collisionSrc, /export function getEntitiesInCorridor/, 'must export getEntitiesInCorridor');
  assert.match(collisionSrc, /export function getEntitiesInRadius/, 'must export getEntitiesInRadius');
});

test('src/entities.ts implements high-capacity object pooling and specialized getters', () => {
  const entitiesSrc = fs.readFileSync('src/entities.ts', 'utf8');
  assert.match(entitiesSrc, /acquireKunai/, 'must export acquireKunai');
  assert.match(entitiesSrc, /acquireFireball/, 'must export acquireFireball');
  assert.match(entitiesSrc, /acquireStarMarkBeam/, 'must export acquireStarMarkBeam');
  assert.match(entitiesSrc, /pool\.length < 500/, 'Projectile pool must support up to 500 recycled instances');
  assert.match(entitiesSrc, /static releaseAll/, 'Projectile must implement releaseAll for bulk reclaim');

  assert.match(entitiesSrc, /class LightningBeam/, 'LightningBeam must exist');
  assert.match(entitiesSrc, /static acquire\(x: number, y: number\)/, 'LightningBeam must implement acquire');
  assert.match(entitiesSrc, /static release\(inst: LightningBeam\)/, 'LightningBeam must implement release');
  assert.match(entitiesSrc, /static releaseAll/, 'LightningBeam must implement releaseAll');
});

test('scripts/build-portal.cjs provides unified build matrix for poki and html5', () => {
  const scriptSrc = fs.readFileSync('scripts/build-portal.cjs', 'utf8');
  assert.match(scriptSrc, /--target=poki/, 'must support poki target');
  assert.match(scriptSrc, /--target=html5/, 'must support html5 target');
  assert.match(scriptSrc, /stickmurai-\$\{target\}\.zip/, 'must output target zip archive');
  assert.match(scriptSrc, /pokiTag/, 'must inject poki-sdk for poki target');
});
