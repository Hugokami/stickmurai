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

count = 0
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(dist_dir):
        # Skip __MACOSX directories
        dirs[:] = [d for d in dirs if d != '__MACOSX']
        for file in files:
            if file.lower() in exclude_names or os.path.splitext(file)[1].lower() in exclude_exts:
                continue
            abs_path = os.path.join(root, file)
            rel_path = os.path.relpath(abs_path, dist_dir)
            zf.write(abs_path, rel_path)
            count += 1

print(f"Packaged {count} files into {zip_path}")
size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"Release Archive Size: {size_mb:.2f} MB")

# Verify root index.html
with zipfile.ZipFile(zip_path, 'r') as zf:
    names = zf.namelist()
    if 'index.html' not in names:
        print("ERROR: index.html is missing from zip root!", file=sys.stderr)
        sys.exit(1)
    print("Verification: index.html confirmed at archive root.")
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
