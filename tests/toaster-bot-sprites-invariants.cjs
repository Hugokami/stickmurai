const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const tbDir = path.join(projectRoot, 'public', 'sprites', 'EnemyToasterBot');

test('ToasterBot Sprite Invariants: frame existence, no blanks, exact counts', (t) => {
  assert.ok(fs.existsSync(tbDir), 'EnemyToasterBot sprite directory exists');

  const expectedFrames = {
    idle: 5,
    walk: 8,
    attack: 11,
    hit: 2,
    dead: 5,
  };

  const files = fs.readdirSync(tbDir).filter(f => f.endsWith('.png'));
  const totalExpected = 5 + 8 + 11 + 2 + 5;
  assert.equal(files.length, totalExpected, `EnemyToasterBot must have exactly ${totalExpected} frames, found ${files.length}`);

  for (const [anim, count] of Object.entries(expectedFrames)) {
    for (let i = 1; i <= count; i++) {
      const pad = String(i).padStart(2, '0');
      const filename = `${anim}${pad}.png`;
      const filePath = path.join(tbDir, filename);
      assert.ok(fs.existsSync(filePath), `Frame ${filename} must exist`);
      
      const stat = fs.statSync(filePath);
      assert.ok(stat.size > 150, `Frame ${filename} must have real image data (>150 bytes, not 86B blank); got ${stat.size} bytes`);
    }

    // Ensure no orphaned blank frames from previous broken 53px slice
    const orphanFile = path.join(tbDir, `${anim}${String(count + 1).padStart(2, '0')}.png`);
    assert.ok(!fs.existsSync(orphanFile), `Orphan frame ${anim}${String(count + 1).padStart(2, '0')}.png must NOT exist`);
  }
});

test('ToasterBot Asset Definition Invariants: assets.ts matches clean animation counts', () => {
  const assetsSrc = fs.readFileSync(path.join(projectRoot, 'src', 'assets.ts'), 'utf-8');
  assert.match(assetsSrc, /idle:\s*loadCustomEnemyAnim\('EnemyToasterBot',\s*'idle',\s*5,\s*false\)/);
  assert.match(assetsSrc, /walk:\s*loadCustomEnemyAnim\('EnemyToasterBot',\s*'walk',\s*8,\s*false\)/);
  assert.match(assetsSrc, /attack:\s*loadCustomEnemyAnim\('EnemyToasterBot',\s*'attack',\s*11,\s*false\)/);
  assert.match(assetsSrc, /hit:\s*loadCustomEnemyAnim\('EnemyToasterBot',\s*'hit',\s*2,\s*false\)/);
  assert.match(assetsSrc, /dead:\s*loadCustomEnemyAnim\('EnemyToasterBot',\s*'dead',\s*5,\s*false\)/);
});

test('ToasterBot Combat Timing Invariants: enemy.ts triggers projectile at frame 6', () => {
  const enemySrc = fs.readFileSync(path.join(projectRoot, 'src', 'enemy.ts'), 'utf-8');
  assert.match(enemySrc, /burstShotsFired === 0 && \(this\.animFrame >= 6 \|\| this\.stateTime >= 0\.26\)/);
  assert.match(enemySrc, /!this\.attackLanded && \(this\.animFrame >= 6 \|\| this\.stateTime >= 0\.32\)/);
});

test('Entities Rendering Invariants: destination coordinates are integer-rounded to prevent subpixel jitter', () => {
  const entitiesSrc = fs.readFileSync(path.join(projectRoot, 'src', 'entities.ts'), 'utf-8');
  assert.match(entitiesSrc, /const dw\s*=\s*Math\.round\(img\.width\s*\*\s*scale\);/);
  assert.match(entitiesSrc, /const dh\s*=\s*Math\.round\(img\.height\s*\*\s*scale\);/);
  assert.match(entitiesSrc, /const dx\s*=\s*Math\.round\(-img\.width\/2\s*\*\s*scale\s*\+\s*aethOffsetX(?:\s*\+\s*akakageOffsetX)?\);/);
  assert.match(entitiesSrc, /const dy\s*=\s*Math\.round\(-img\.height\/2\s*\*\s*scale\);/);
});
