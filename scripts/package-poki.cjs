const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const releaseDir = path.join(rootDir, 'release');
const zipPath = path.join(releaseDir, 'stickmurai-poki.zip');
const distZipPath = path.join(distDir, 'stickmurai-poki.zip');
const pokiFolder = path.join(releaseDir, 'poki');

const args = process.argv.slice(2);
const shouldBuild = !args.includes('--no-build');

if (shouldBuild) {
  console.log('--- 1. Building Stickmurai (npm run build) ---');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} else {
  console.log('--- 1. Skipping build step (--no-build specified) ---');
}

if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('Error: dist/index.html does not exist after build!');
  process.exit(1);
}

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
if (fs.existsSync(distZipPath)) fs.unlinkSync(distZipPath);
if (fs.existsSync(pokiFolder)) {
  fs.rmSync(pokiFolder, { recursive: true, force: true });
}
fs.mkdirSync(pokiFolder, { recursive: true });

console.log('\n--- 2. Packaging Poki release for Poki Inspector & Platform ---');

const pythonScript = `
import os, zipfile, sys, shutil

dist_dir = sys.argv[1]
zip_path = sys.argv[2]
poki_folder = sys.argv[3]

exclude_exts = {'.unitypackage', '.map', '.zip'}
exclude_names = {'.ds_store', 'thumbs.db'}

with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(dist_dir):
        # Exclude sub-target release dirs if any exist inside dist
        dirs[:] = [d for d in dirs if d.lower() not in {'crazygames', 'poki'}]
        for file in files:
            name_lower = file.lower()
            if name_lower in exclude_names or any(name_lower.endswith(ext) for ext in exclude_exts):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dist_dir)
            
            zf.write(full_path, rel_path)
            dest_file = os.path.join(poki_folder, rel_path)
            os.makedirs(os.path.dirname(dest_file), exist_ok=True)
            shutil.copy2(full_path, dest_file)

print(f"Poki ZIP packaged successfully: {zip_path}")
`;

const pyScriptPath = path.join(rootDir, '_poki_zip.py');
fs.writeFileSync(pyScriptPath, pythonScript, 'utf8');

try {
  execSync(`python "${pyScriptPath}" "${distDir}" "${zipPath}" "${pokiFolder}"`, {
    cwd: rootDir,
    stdio: 'inherit'
  });
  // Copy to dist/ as well
  fs.copyFileSync(zipPath, distZipPath);
} finally {
  if (fs.existsSync(pyScriptPath)) {
    fs.unlinkSync(pyScriptPath);
  }
}

const stats = fs.statSync(zipPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`\n=== POKI PACKAGE READY ===`);
console.log(`Zip archive: ${zipPath} (${sizeMB} MB)`);
console.log(`Inspector folder: ${pokiFolder}`);
console.log(`Tip: Drag '${pokiFolder}' or '${zipPath}' directly into Poki Inspector to verify!`);
