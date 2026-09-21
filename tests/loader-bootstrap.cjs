const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const loader = html.slice(html.indexOf('<div id="loader-screen"'), html.indexOf('<!-- First-Start Combat Initiation Tutorial Modal'));

test('loader embeds full 1254-square user artwork; no substitute or duplicate title', () => {
  const image = html.match(/<img[^>]*id="loader-artwork"[^>]*>/)?.[0];
  assert.ok(image, 'Use supplied muramasa.png artwork, not old swordsman');
  assert.match(image, /width="1254" height="1254"/);
  const bytes = Buffer.from(image.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/)[1], 'base64');
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.deepEqual(bytes, fs.readFileSync(path.join(root, 'public/assets/muramasa-loader.webp')));
  // Full resolution WebP quality 90; original retained for provenance, no crop/repaint.
  assert.ok(bytes.length <= 110 * 1024, `Artwork ${bytes.length} bytes exceeds 110 KiB`);
  assert.ok(image.length <= 148 * 1024, 'Embedded base64 markup exceeds 148 KiB');
  const original = fs.readFileSync(path.join(root, 'public/assets/muramasa.png'));
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'), '79ac6e9458e675b1c762eeab8c59c3f22ecc1ad5b857aaa535980784d37be957');
  assert.doesNotMatch(loader, /loader-title|loader-seal|loader-character|loader-ground-line|<h[1-6]\b/);
});

test('first paint has complete responsive critical CSS and nonblocking portal SDK', () => {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /aspect-ratio:\s*1/);
  assert.match(css, /safe-area-inset/);
  assert.match(css, /max-height:\s*420px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(html, /<script[^>]*\bdefer\b[^>]*poki-sdk/);
  assert.match(html, /<button[^>]*id="loader-ready-btn"[^>]*disabled/);
  assert.match(html, /25000/);
  assert.doesNotMatch(html, /forceDismissLoader/);
});

function loaderHarness(readiness) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { style: {}, innerText: '', disabled: true,
      dataset: {}, attrs: {}, classList: { add() {} }, addEventListener() {}, removeEventListener() {},
      setAttribute(k, v) { this.attrs[k] = v; } });
    return elements.get(id);
  };
  const context = { document: { getElementById: element }, window: {},
    assetReadiness: () => readiness, AdManager: { gameLoadingFinished() {} }, clearTimeout() {},
    setTimeout() {}, console };
  vm.createContext(context);
  const code = main.slice(main.indexOf('let loadingFinished = false;'), main.indexOf('\nfunction t(key:'));
  vm.runInContext(stripTypeScriptTypes(code), context);
  return { context, element };
}

test('unready progress tracks loaded assets, never elapsed time', () => {
  const { context, element } = loaderHarness({ loaded: 3, total: 8, failed: 1, ready: false });
  vm.runInContext('updateLoaderProgress()', context);
  assert.equal(element('loader-fill').style.width, '37%');
  assert.equal(element('loader-percent-text').innerText, '37%');
  assert.equal(element('loader-status').innerText, 'Connection interrupted');
  assert.equal(element('loader-ready-btn').disabled, true);
});

test('existing audio unlock and readiness gate remain', () => {
  assert.match(main, /if \(!assetReadiness\(\)\.ready\) return/);
  assert.match(main, /triggerBgmGestureUnlock\(\)/);
  assert.match(main, /loaderScreen\.addEventListener\('touchend', onContinue\)/);
  assert.match(main, /loaderScreen\.addEventListener\('pointerup', onContinue\)/);
  assert.match(main, /retryRequiredAssets\(\)/);
});
