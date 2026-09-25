const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('muramasa-exe-update: verifies title, ATK labeling, combo hitboxes, and mobile landscape layout', (t) => {
  const root = path.resolve(__dirname, '..');

  // 1. Game Name changed to MURAMASA.EXE everywhere
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexHtml, /<title>MURAMASA\.EXE<\/title>/, 'index.html title is MURAMASA.EXE');
  assert.match(indexHtml, /<h1 class="game-title" data-i18n="title">MURAMASA\.EXE<\/h1>/, 'index.html header title is MURAMASA.EXE');

  const manifestJson = JSON.parse(fs.readFileSync(path.join(root, 'public', 'manifest.json'), 'utf8'));
  assert.equal(manifestJson.name, 'MURAMASA.EXE', 'manifest.json name is MURAMASA.EXE');
  assert.equal(manifestJson.short_name, 'MURAMASA.EXE', 'manifest.json short_name is MURAMASA.EXE');

  const assetsTs = fs.readFileSync(path.join(root, 'src', 'assets.ts'), 'utf8');
  assert.match(assetsTs, /title:\s*"MURAMASA\.EXE"/, 'assets.ts EN title is MURAMASA.EXE');

  // 2. ATK% labeling in place of Slash DMG
  const powerupsTs = fs.readFileSync(path.join(root, 'src', 'powerups.ts'), 'utf8');
  assert.match(powerupsTs, /label:\s*'\+12% ATK'/, 'Powerups offer +12% ATK');
  assert.match(powerupsTs, /desc2:\s*'\+15% ATK'/, 'Synergy blade art grants +15% ATK');
  assert.match(powerupsTs, /ATK:\s*<b style="color: #4ade80;">/, 'Stats inspect sheet labels ATK');
  assert.match(powerupsTs, /Slash Elixir \(\+5% ATK\)/, 'Shop potion labeled +5% ATK');

  const uiTs = fs.readFileSync(path.join(root, 'src', 'ui.ts'), 'utf8');
  assert.match(uiTs, /\+1% ATK per level/, 'Ascension upgrade Katana Sharpness labels +1% ATK');
  assert.match(uiTs, /\+0\.5% ATK per rank/, 'Ascension upgrade Infinite Sharpness labels +0.5% ATK');

  // 3. Combo Hitbox Buffs: Swift Strike (dash+slash) & Dimension Rend (iaijutsu+dash) & Vortex Shatter
  const mainTs = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
  assert.match(mainTs, /dist < 260 \|\| dStart < 220 \|\| dEnd < 220/, 'Swift Strike hitbox widened to 260 radius with endpoint checks');
  assert.match(mainTs, /\(distToLine < 220 && inBBox\) \|\| dStart < 240 \|\| dEnd < 240/, 'Dimension Rend hitbox widened to 220 radius with endpoint checks');
  assert.match(mainTs, /distSq < 520 \* 520/, 'Vortex Shatter pull and damage radius buffed to 520');
  assert.match(mainTs, /dist < 280 \|\| dStart < 240 \|\| dEnd < 240/, 'Thunderclap and Flash dash corridor widened to 280 with endpoint checks');

  const playerTs = fs.readFileSync(path.join(root, 'src', 'player.ts'), 'utf8');
  assert.match(playerTs, /now - globals\.lastIaijutsuFireTime < 600/, 'Vortex Shatter combo window widened to 600ms');
  assert.match(playerTs, /angleDiff < Math\.PI \* 0\.65/, 'Vortex Shatter angle tolerance relaxed to 117 degrees');

  // 4. Mobile Landscape Orientation & Viewport Fixes
  const rendererTs = fs.readFileSync(path.join(root, 'src', 'renderer.ts'), 'utf8');
  assert.match(rendererTs, /isScreenLandscape && bestW < bestH/, 'resizeCanvas swaps dimensions when screen is landscape but browser reported stale portrait values');
  assert.match(rendererTs, /ctx\.setTransform\(currentDpr, 0, 0, currentDpr, 0, 0\);[\s\S]*ctx\.clearRect\(0, 0, globals\.width, globals\.height\);\s*drawBackground\(ctx\);/, 'drawBackground covers the logical canvas at device pixel ratio');
  assert.match(rendererTs, /ctx\.translate\(globals\.vw \/ 2 - globals\.camera\.x, globals\.vh \/ 2 - globals\.camera\.y\);/, 'stone pattern tracks camera in world coordinates');
  assert.match(rendererTs, /ctx\.fillStyle = '#1a1619'/, 'unloaded ground uses dark stone fallback');
  assert.match(assetsTs, /queueAsset\(groundImage, '\.\/fantasy_bg\/ground_stone1\.png\?v=stone1'/, 'ground stone is queued before gameplay');
  assert.ok(fs.existsSync(path.join(root, 'public', 'fantasy_bg', 'ground_stone1.png')), 'stone tile exists');
  assert.match(rendererTs, /ResizeObserver/, 'renderer observes documentElement and body with ResizeObserver');
  assert.match(rendererTs, /\[20, 60, 150, 300, 600, 1000\]\.forEach/, 'renderer schedules multi-tier settling passes for direct mobile landscape boots');

  assert.match(mainTs, /rotatePrompt\.style\.display = 'none';\s*resizeCanvas\(\);/, 'checkOrientationAndFullscreen calls resizeCanvas when landscape is active');
  assert.match(mainTs, /\[20, 60, 150, 300, 600, 1000\]\.forEach/, 'startApp schedules multi-tier settling passes for direct mobile landscape boots');

  const styleCss = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');
  assert.match(styleCss, /width: 100vw;[\s\S]*?height: 100dvh;/, 'overlay has 100vw and 100dvh sizing');
  assert.match(styleCss, /width: 96% !important;/, 'mobile landscape main menu box expands to 96% width');
});
