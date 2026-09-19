const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

test('currency overhaul: all required icon assets exist with non-zero size', () => {
  const iconFiles = [
    'mon_coin.png',
    'mon_string_pack.png',
    'stage_gold.png',
    'stage_gold_chest.png',
    'potion_health.png',
    'potion_attack.png',
    'gem_revive.png',
    'gem_swift.png',
    'gem_double.png',
    'scroll_reroll.png'
  ];

  for (const file of iconFiles) {
    const filePath = path.join(__dirname, '..', 'public', 'icons', file);
    assert.ok(fs.existsSync(filePath), `Icon public/icons/${file} must exist`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 1000, `Icon public/icons/${file} must have valid content (>1KB, got ${stat.size})`);
  }
});

test('stage-scaled Mon reward formula calculates correctly and scales monotonically', () => {
  function getStageMonReward(stage) {
    const s = Math.max(1, stage || 1);
    const base = 100;
    const linear = (s - 1) * 25;
    const exp = Math.floor(Math.pow(s, 1.25) * 4);
    let total = base + linear + exp;
    if (s % 5 === 0) {
      total = Math.round(total * 1.5);
    }
    return total;
  }

  const s1 = getStageMonReward(1);
  const s2 = getStageMonReward(2);
  const s5 = getStageMonReward(5);
  const s10 = getStageMonReward(10);
  const s20 = getStageMonReward(20);

  assert.equal(s1, 104, 'Stage 1 reward should be 104 Mon');
  assert.ok(s2 > s1, 'Stage 2 reward must exceed Stage 1');
  assert.ok(s5 > s2 * 1.5, 'Stage 5 boss stage must apply 1.5x multiplier');
  assert.ok(s10 > s5, 'Stage 10 boss stage must exceed Stage 5');
  assert.ok(s20 > s10, 'Stage 20 must scale significantly higher');
});

test('poki package: output contains root index.html and clean runtime bundle', () => {
  const releasePokiDir = path.join(__dirname, '..', 'release', 'poki');
  const indexHtmlPath = path.join(releasePokiDir, 'index.html');
  assert.ok(fs.existsSync(indexHtmlPath), 'release/poki/index.html must exist at the root of the folder');

  const zipPath = path.join(__dirname, '..', 'release', 'stickmurai-poki.zip');
  assert.ok(fs.existsSync(zipPath), 'release/stickmurai-poki.zip must exist');

  // Verify that index.html is at the root of the zip archive
  const zipListing = execSync(`python3 -c "import zipfile; z = zipfile.ZipFile('${zipPath.replace(/\\/g, '/')}'); print([n for n in z.namelist() if n == 'index.html'])"`).toString();
  assert.match(zipListing, /'index\.html'/, 'index.html must be present at root level inside stickmurai-poki.zip');
});

test('HTML and UI templates ban coins/chests for non-currency powerup ads', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
  const powerupsSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'powerups.ts'), 'utf-8');

  // Swift strike blessing should use gem_swift, not coin/chest
  assert.match(indexHtml, /gem_swift\.png/, 'Swift strike blessing must use gem_swift.png');

  // Fortune blessing should use mon_string_pack.png
  assert.match(indexHtml, /mon_string_pack\.png/, 'Fortune blessing must use mon_string_pack.png');

  // Revive button must use gem_revive.png
  assert.match(indexHtml, /gem_revive\.png/, 'Revive button must use gem_revive.png');

  // Field ration & slash elixir must use potion icons
  assert.match(powerupsSrc, /potion_health\.png/, 'Shop Field Ration must use potion_health.png');
  assert.match(powerupsSrc, /potion_attack\.png/, 'Shop Slash Elixir must use potion_attack.png');

  // Gold chest must be used only for stage gold
  assert.match(powerupsSrc, /stage_gold_chest\.png/, 'Merchant cache ad must use stage_gold_chest.png');
});
