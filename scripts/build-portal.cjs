#!/usr/bin/env node

/**
 * Unified Portal Build Matrix for Stickmurai / MURAMASA.EXE
 * Usage:
 *   node scripts/build-portal.cjs --target=poki
 *   node scripts/build-portal.cjs --target=html5
 *   node scripts/build-portal.cjs --target=crazygames (discontinued notice)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
let target = 'poki';
let shouldBuild = true;

for (const arg of args) {
  if (arg.startsWith('--target=')) {
    target = arg.split('=')[1].toLowerCase();
  } else if (arg === '--skip-build' || arg === '--no-build') {
    shouldBuild = false;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Unified Portal Build Matrix
Usage: node scripts/build-portal.cjs --target=<target>

Available targets:
  --target=poki        Build Poki-compliant distribution & release/stickmurai-poki.zip
  --target=html5       Build standalone offline HTML5 release & release/stickmurai-html5.zip
  --target=crazygames  Build extracted clean CrazyGames release & release/crazygames
`);
    process.exit(0);
  }
}

if (!['poki', 'html5', 'crazygames'].includes(target)) {
  console.error(`[build-portal] Unknown target: "${target}". Valid options: poki, html5, crazygames`);
  process.exit(1);
}

console.log(`\n========================================`);
console.log(`  MURAMASA.EXE PORTAL BUNDLER [${target.toUpperCase()}]`);
console.log(`========================================\n`);

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASE_ROOT = path.join(ROOT_DIR, 'release');
const TARGET_RELEASE_DIR = path.join(RELEASE_ROOT, target);
const ZIP_NAME = target === 'html5' ? 'MURAMASA.EXE.zip' : `muramasa-${target}.zip`;
const ZIP_PATH = path.join(RELEASE_ROOT, ZIP_NAME);

// Step 1: Ensure dist build exists and is up to date
if (shouldBuild) {
  console.log('[1/5] Building production web assets (npm run build)...');
  try {
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch (err) {
    console.error('[build-portal] Build failed:', err.message);
    process.exit(1);
  }
} else {
  console.log('[1/5] Skipping build (--skip-build specified)...');
}

// Step 2: Clean and prepare release directory
console.log(`[2/5] Preparing output directory: ${TARGET_RELEASE_DIR}...`);
if (fs.existsSync(TARGET_RELEASE_DIR)) {
  fs.rmSync(TARGET_RELEASE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TARGET_RELEASE_DIR, { recursive: true });

// Step 3: Copy core files
console.log('[3/5] Copying distribution assets...');
const distFiles = fs.readdirSync(DIST_DIR);

if (target === 'html5' || target === 'crazygames') {
  // Standalone HTML5 / Itch.io / CrazyGames package whitelist:
  // Platform limit: under 1,000 files and under 25 MB.
  // All character sprites, enemy frames, VFX animations, and backgrounds are bundled in assets.bin (20 MB),
  // which is unpacked into in-memory object URL blobs at startup by ensurePackedAssets().
  // Loose unbundled raw frame directories (vfx: 4,779 files, sprites: 1,166 files) are excluded.
  const allowedDirs = new Set(['assets', 'audio', 'fonts', 'icons', 'ui', 'fantasy_bg']);
  const allowedFiles = new Set(['index.html', 'favicon.svg', 'manifest.json', 'sw.js', 'assets.bin']);

  for (const file of distFiles) {
    const src = path.join(DIST_DIR, file);
    const dest = path.join(TARGET_RELEASE_DIR, file);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      if (allowedDirs.has(file)) {
        fs.cpSync(src, dest, { recursive: true });
      }
    } else {
      if (allowedFiles.has(file) || file.endsWith('.json') || file.endsWith('.svg') || file.endsWith('.bin') || file.endsWith('.ico') || file.endsWith('.html')) {
        fs.copyFileSync(src, dest);
      }
    }
  }

  // Also copy hero portraits if present
  const portraitsSrc = path.join(DIST_DIR, 'sprites', 'portraits');
  const portraitsDest = path.join(TARGET_RELEASE_DIR, 'sprites', 'portraits');
  if (fs.existsSync(portraitsSrc)) {
    fs.mkdirSync(portraitsDest, { recursive: true });
    fs.cpSync(portraitsSrc, portraitsDest, { recursive: true });
  }
} else {
  for (const file of distFiles) {
    const src = path.join(DIST_DIR, file);
    const dest = path.join(TARGET_RELEASE_DIR, file);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// Ensure assets.bin exists in release directory
const assetsBinSrc = path.join(ROOT_DIR, 'public', 'assets.bin');
const assetsBinDest = path.join(TARGET_RELEASE_DIR, 'assets.bin');
if (fs.existsSync(assetsBinSrc) && !fs.existsSync(assetsBinDest)) {
  console.log('      Copying public/assets.bin to release bundle...');
  fs.copyFileSync(assetsBinSrc, assetsBinDest);
}

// Step 4: Patch index.html according to target specification
console.log(`[4/5] Applying ${target.toUpperCase()} portal transforms to index.html...`);
const indexPath = path.join(TARGET_RELEASE_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('[build-portal] ERROR: index.html not found in release bundle!');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Strip any leftover portal SDK traces
html = html.replace(/<script[^>]*poki-sdk[^>]*><\/script>/gi, '');
html = html.replace(/<script[^>]*crazygames[^>]*><\/script>/gi, '');

if (target === 'poki') {
  // Inject Poki SDK v2 in head
  const pokiTag = '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>';
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n    ${pokiTag}`);
  } else {
    html = `${pokiTag}\n${html}`;
  }
}

// Ensure proper viewport and letterbox background color
if (!html.includes('background-color: #527c2f') && !html.includes('background-color:#527c2f')) {
  html = html.replace('</head>', `    <style>html, body { background-color: #527c2f !important; margin: 0; padding: 0; overflow: hidden; }</style>\n  </head>`);
}

fs.writeFileSync(indexPath, html, 'utf8');

// Step 5: Archive into zip bundle using Python zipfile for speed and cross-platform reliability
console.log(`[5/5] Packaging ${ZIP_NAME}...`);

// Count files in TARGET_RELEASE_DIR
let totalFiles = 0;
function countFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      countFiles(path.join(dir, entry.name));
    } else {
      totalFiles++;
    }
  }
}
countFiles(TARGET_RELEASE_DIR);
console.log(`      Total files in release bundle: ${totalFiles} (itch.io limit: < 1000)`);
if (target === 'html5' && totalFiles > 1000) {
  console.error(`[build-portal] ERROR: Package contains ${totalFiles} files, exceeding itch.io's hard limit of 1,000 files!`);
  process.exit(1);
}

if (fs.existsSync(ZIP_PATH)) {
  fs.unlinkSync(ZIP_PATH);
}

const pyArchiver = `
import os, sys, zipfile

src_dir = sys.argv[1]
zip_path = sys.argv[2]

with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(src_dir):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, src_dir).replace('\\\\', '/')
            zf.write(full_path, rel_path)
`;

const pyScriptPath = path.join(ROOT_DIR, '_portal_zip.py');
fs.writeFileSync(pyScriptPath, pyArchiver, 'utf8');

try {
  execSync(`python "${pyScriptPath}" "${TARGET_RELEASE_DIR}" "${ZIP_PATH}"`, {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
} catch (err) {
  console.warn(`[build-portal] Python zip failed, falling back:`, err.message);
  try {
    if (process.platform === 'win32') {
      execSync(`tar -a -c -f "${ZIP_PATH}" -C "${TARGET_RELEASE_DIR}" *`, { stdio: 'inherit' });
    } else {
      execSync(`cd "${TARGET_RELEASE_DIR}" && zip -r -q "${ZIP_PATH}" .`, { stdio: 'inherit' });
    }
  } catch (fallbackErr) {
    console.warn(`[build-portal] Fallback zip failed:`, fallbackErr.message);
  }
} finally {
  if (fs.existsSync(pyScriptPath)) {
    fs.unlinkSync(pyScriptPath);
  }
}

const stats = fs.existsSync(ZIP_PATH) ? fs.statSync(ZIP_PATH) : null;
const zipSizeMb = stats ? (stats.size / (1024 * 1024)).toFixed(2) : 'N/A';

console.log(`\n========================================`);
console.log(`  BUILD SUCCESSFUL: ${target.toUpperCase()}`);
console.log(`  Directory: ${TARGET_RELEASE_DIR}`);
if (stats) {
  console.log(`  Package:   ${ZIP_PATH} (${zipSizeMb} MB)`);
  if (target === 'html5') {
    const itchZipPath = path.join(RELEASE_ROOT, 'muramasa-itch.zip');
    fs.copyFileSync(ZIP_PATH, itchZipPath);
    const html5ZipPath = path.join(RELEASE_ROOT, 'muramasa-html5.zip');
    fs.copyFileSync(ZIP_PATH, html5ZipPath);
    const rawExePath = path.join(RELEASE_ROOT, 'MURAMASA.EXE');
    try { fs.copyFileSync(ZIP_PATH, rawExePath); } catch {}
    const muramasaFolder = path.join(RELEASE_ROOT, 'MURAMASA.EXE_dir');
    try {
      if (fs.existsSync(muramasaFolder)) fs.rmSync(muramasaFolder, { recursive: true, force: true });
      fs.cpSync(TARGET_RELEASE_DIR, muramasaFolder, { recursive: true });
    } catch {}
    console.log(`  MURAMASA.EXE: ${ZIP_PATH} (${zipSizeMb} MB)`);
    console.log(`  Itch Zip:     ${itchZipPath} (${zipSizeMb} MB)`);
  }
}
console.log(`========================================\n`);
