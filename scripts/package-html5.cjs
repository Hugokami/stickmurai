const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const releaseDir = path.join(rootDir, 'release');
const zipPath = path.join(releaseDir, 'stickmurai-html5.zip');

const args = process.argv.slice(2);
const shouldBuild = !args.includes('--no-build');

if (shouldBuild) {
  console.log('--- 1. Building Stickmurai (npm run build) ---');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} else {
  console.log('--- 1. Skipping build step (--no-build specified) ---');
}

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist after build!');
  process.exit(1);
}

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('Error: dist/index.html does not exist!');
  process.exit(1);
}

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log('\n--- 2. Packaging HTML5 release for itch.io & Newgrounds ---');

// Use Python's built-in zipfile for reliable fast compression without heavy npm dependencies
const pythonScript = `
import os, zipfile, sys

dist_dir = sys.argv[1]
zip_path = sys.argv[2]

exclude_exts = {'.unitypackage', '.map'}
exclude_names = {'.ds_store', 'thumbs.db'}

# HTML5 standalone package whitelist
# Sprites and VFX are cleanly packed inside assets.bin (lazy on-demand texture loading)
# Backgrounds and hero portraits are loose for instantaneous native rendering.
# Stays strictly within itch.io's 1,000-file platform ceiling (~50 files total).
allowed_root_files = {'index.html', 'manifest.json', 'sw.js', 'favicon.svg', 'assets.bin'}
allowed_dirs = {'assets', 'audio', 'fonts', 'fantasy_bg'}
allowed_icons = {
    'release_v1.2-single_38.png',
    'release_v1.2-single_15.png',
    'release_v1.2-single_77.png',
    'release_v1.2-single_5.png',
    'release_v1.2-single_88.png',
    'release_v1.2-single_1.png'
}

files_to_pack = []

# 1. Root files
for rf in allowed_root_files:
    fp = os.path.join(dist_dir, rf)
    if os.path.exists(fp):
        files_to_pack.append((fp, rf))

# 2. Allowed subdirectories (assets, audio, fonts, fantasy_bg)
for ad in allowed_dirs:
    sdir = os.path.join(dist_dir, ad)
    if os.path.exists(sdir):
        for root, dirs, files in os.walk(sdir):
            for f in files:
                if f.lower() in exclude_names or os.path.splitext(f)[1].lower() in exclude_exts:
                    continue
                abs_path = os.path.join(root, f)
                rel_path = os.path.relpath(abs_path, dist_dir).replace('\\\\', '/')
                files_to_pack.append((abs_path, rel_path))

# 3. Allowed icons
icons_dir = os.path.join(dist_dir, 'icons')
if os.path.exists(icons_dir):
    for icon in allowed_icons:
        fp = os.path.join(icons_dir, icon)
        if os.path.exists(fp):
            files_to_pack.append((fp, f'icons/{icon}'))

# 4. Hero Portraits (guaranteed loose for 100% reliable zero-delay Dojo hero displays)
portraits_dir = os.path.join(dist_dir, 'sprites', 'portraits')
if os.path.exists(portraits_dir):
    for f in os.listdir(portraits_dir):
        if f.endswith('.png'):
            fp = os.path.join(portraits_dir, f)
            files_to_pack.append((fp, f'sprites/portraits/{f}'))

count = len(files_to_pack)
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for abs_path, rel_path in files_to_pack:
        zf.write(abs_path, rel_path)

print(f"Packaged {count} files into {zip_path}")
size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"Release Archive Size: {size_mb:.2f} MB")

# Verify root index.html
with zipfile.ZipFile(zip_path, 'r') as zf:
    names = zf.namelist()
    if 'index.html' not in names:
        print("ERROR: index.html is missing from zip root!", file=sys.stderr)
        sys.exit(1)
    if count > 1000:
        print(f"ERROR: Archive contains {count} files, exceeding itch.io limit of 1000!", file=sys.stderr)
        sys.exit(1)
    print("Verification: index.html confirmed at archive root.")
    print(f"Verification: File count ({count} files) is well within itch.io limit (<= 1000).")
`;

const tempPy = path.join(releaseDir, '_zip_helper.py');
fs.writeFileSync(tempPy, pythonScript, 'utf8');

try {
  execSync(`python "${tempPy}" "${distDir}" "${zipPath}"`, { cwd: rootDir, stdio: 'inherit' });
} finally {
  if (fs.existsSync(tempPy)) {
    fs.unlinkSync(tempPy);
  }
}

console.log('\n======================================================');
console.log('SUCCESS: HTML5 game archive created!');
console.log(`Target: ${zipPath}`);
console.log('Ready to upload directly to itch.io, Newgrounds, or Game Jolt.');
console.log('======================================================');
