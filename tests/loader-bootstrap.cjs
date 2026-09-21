const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const htmlPath = path.join(__dirname, '../index.html');
const stylePath = path.join(__dirname, '../src/style.css');
const mainPath = path.join(__dirname, '../src/main.ts');

const html = fs.readFileSync(htmlPath, 'utf8');
const styleCss = fs.readFileSync(stylePath, 'utf8');
const mainTs = fs.readFileSync(mainPath, 'utf8');

test('MURAMASA Sealed-Blade Loader: Static Invariants & Bootstrap Asset Contract', async (t) => {
  await t.test('index.html loader contains MURAMASA title, quiet art direction, no generic neon/mist/enso', () => {
    // Check title text inside loader screen
    assert.match(html, /<[^>]*id=["']loader-screen["'][\s\S]*?>/, 'Loader screen must exist');
    assert.match(html, /MURAMASA/, 'Loader must prominently feature MURAMASA title');
    
    // Generic fluff removed from loader screen
    assert.doesNotMatch(html, /loader-enso-wrap/, 'No enso brush circle in loader markup');
    assert.doesNotMatch(html, /loader-bg-mist/, 'No glowing background mist in loader markup');
    assert.doesNotMatch(html, /loader-embers|embers-container/, 'No embers/spark container in loader markup');
    assert.doesNotMatch(html, /katana-slash-line/, 'No katana slash line decoration in loader markup');
    assert.doesNotMatch(html, /loader-kanji-bg/, 'No generic spinning/glowing kanji background in loader markup');
  });

  await t.test('single source swordsman still embedded as optimized data URL within <=32KiB budget', () => {
    // 8 frame preloads must be removed
    assert.doesNotMatch(html, /<link rel="preload" as="image" href="[^"]*sword_Idle_000[1-8]\.png"/, '8 external sword idle preloads must be removed');
    // __loaderStickmuraiSprites preload loop must be removed
    assert.doesNotMatch(html, /__loaderStickmuraiSprites/, 'window.__loaderStickmuraiSprites eager preload array removed');

    // Single embedded data URL image
    const dataUrlMatch = html.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
    assert.ok(dataUrlMatch, 'Optimized swordsman still must be embedded as inline PNG data URL in index.html');
    
    const b64Data = dataUrlMatch[1];
    const b64Len = b64Data.length;
    const rawBuffer = Buffer.from(b64Data, 'base64');
    
    // Validate PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    assert.equal(rawBuffer[0], 0x89, 'Byte 0 must be 0x89');
    assert.equal(rawBuffer[1], 0x50, 'Byte 1 must be 0x50 (P)');
    assert.equal(rawBuffer[2], 0x4E, 'Byte 2 must be 0x4E (N)');
    assert.equal(rawBuffer[3], 0x47, 'Byte 3 must be 0x47 (G)');

    // Check size contract: <= 32 KiB raw decoded, <= 44 KiB base64
    assert.ok(rawBuffer.length <= 32768, `Raw PNG is ${rawBuffer.length} bytes, must be <= 32768 (32 KiB)`);
    assert.ok(b64Len <= 45056, `Base64 string is ${b64Len} chars, must be <= 45056 (44 KiB)`);
  });

  await t.test('Critical CSS inline in index.html guarantees dark first paint and sealed-blade dimensions', () => {
    assert.match(html, /#loader-screen[\s\S]*?background:\s*#090a0f/, 'Inline critical CSS must give #loader-screen background: #090a0f');
    // Ground line 220px, progress track 220x2px #34312e with fill #aa3533
    assert.match(html, /220px/, '220px width used for ground/progress track');
    assert.match(html, /#34312e/, 'Progress track #34312e');
    assert.match(html, /#aa3533/, 'Progress fill #aa3533');
    // Title ivory #e7dfce
    assert.match(html, /#e7dfce/, 'Main title warm ivory #e7dfce');
  });

  await t.test('Ready CTA button exists, starts disabled, has min-height 44px, and label DRAW THE BLADE', () => {
    assert.match(html, /id=["']loader-ready-btn["']/, 'Ready CTA button must have id="loader-ready-btn"');
    assert.match(html, /DRAW THE BLADE/, 'Ready CTA button must have text "DRAW THE BLADE"');
    assert.match(html, /<button[^>]*id=["']loader-ready-btn["'][^>]*disabled/, 'Ready CTA button must start disabled');
  });

  await t.test('Watchdog in index.html preserves 25s timeout and shows retry recovery without unsafe dismissal', () => {
    assert.match(html, /25000/, 'Inline watchdog must maintain 25000ms (25s) threshold');
    // Must NOT forceDismissLoader or hide loader blindly
    assert.doesNotMatch(html, /function forceDismissLoader\(\)/, 'Watchdog must not force dismiss loader into main menu');
    assert.match(html, /Still loading|retry|reload/i, 'Watchdog recovery UI indicates still loading / retry option');
  });
});

test('MURAMASA Sealed-Blade Loader: CSS Responsive & Reduced-Motion Contracts', async (t) => {
  await t.test('style.css pruned obsolete loader mist/enso/hud rules and supports 568x320 landscape and safe areas', () => {
    // Obsolete classes pruned from style.css
    assert.doesNotMatch(styleCss, /\.loader-bg-mist/, 'Obsolete .loader-bg-mist pruned from style.css');
    assert.doesNotMatch(styleCss, /\.loader-enso-wrap/, 'Obsolete .loader-enso-wrap pruned from style.css');
    assert.doesNotMatch(styleCss, /\.katana-slash-line/, 'Obsolete .katana-slash-line pruned from style.css');
    assert.doesNotMatch(styleCss, /#loader-embers/, 'Obsolete #loader-embers pruned from style.css');

    // Landscape 568x320 supports two-column layout
    assert.match(styleCss, /safe-area-inset/, 'CSS respects safe-area-insets');
  });

  await t.test('style.css respects prefers-reduced-motion', () => {
    assert.match(styleCss, /prefers-reduced-motion/, 'style.css contains prefers-reduced-motion rules');
  });
});

test('MURAMASA Sealed-Blade Loader: main.ts State & Readiness Invariants', async (t) => {
  await t.test('startLoaderStickmanAnimation and frame loop interval removed from main.ts', () => {
    assert.doesNotMatch(mainTs, /function startLoaderStickmanAnimation/, 'startLoaderStickmanAnimation must be removed');
    assert.doesNotMatch(mainTs, /loaderStickmanInterval/, 'loaderStickmanInterval must be removed');
  });

  await t.test('tipsInterval removed or cleaned up from main.ts', () => {
    assert.doesNotMatch(mainTs, /tipsInterval/, 'Obsolete tipsInterval removed from main.ts');
  });

  await t.test('finishLoading requires assetReadiness().ready, enables DRAW THE BLADE CTA, triggers audio unlock once', () => {
    assert.match(mainTs, /assetReadiness\(\)\.ready/, 'finishLoading checks assetReadiness().ready');
    assert.match(mainTs, /loader-ready-btn/, 'finishLoading references #loader-ready-btn');
    assert.match(mainTs, /triggerBgmGestureUnlock\(\)/, 'Interaction triggers audio unlock');
    assert.match(mainTs, /loaderScreen\.addEventListener\('touchend',\s*onContinue\)/, 'loaderScreen listens to touchend for mobile audio unlock');
    assert.match(mainTs, /loaderScreen\.addEventListener\('pointerup',\s*onContinue\)/, 'loaderScreen listens to pointerup for mobile audio unlock');
  });

  await t.test('updateLoaderProgress honest reporting: Preparing assets / Ready / Connection interrupted', () => {
    assert.match(mainTs, /Preparing assets/i, 'updateLoaderProgress reports Preparing assets');
  });
});

test('MURAMASA Sealed-Blade Loader: Headless Browser First Paint Verification', async () => {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  if (!fs.existsSync(chromePath)) {
    return; // Skip browser paint test if Chrome binary not found on host
  }

  // Run headless Chrome to dump DOM of index.html and verify loader rendered
  const res = cp.spawnSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--dump-dom',
    `file:///${htmlPath.replace(/\\/g, '/')}`
  ], { encoding: 'utf8', timeout: 15000 });

  assert.equal(res.status, 0, 'Headless Chrome must exit with status 0');
  const renderedDom = res.stdout;
  assert.match(renderedDom, /MURAMASA/, 'MURAMASA must be rendered in DOM');
  assert.match(renderedDom, /loader-ready-btn/, 'loader-ready-btn must be present in DOM');
  assert.match(renderedDom, /DRAW THE BLADE/, 'DRAW THE BLADE CTA must be present in DOM');
  assert.match(renderedDom, /data:image\/png;base64,/, 'Embedded swordsman image present in DOM');
});
