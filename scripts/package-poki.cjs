const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const releaseDir = path.join(rootDir, 'release');
const zipPath = path.join(releaseDir, 'muramasa-poki.zip');
const distZipPath = path.join(distDir, 'muramasa-poki.zip');
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

// Whitelist-based packager matching Poki standards:
// Only package essential runtime files so Poki Inspector directory upload and ZIP upload
// process cleanly without hitting browser file-count limits or missing index.html.
const pythonScript = `
import os, zipfile, sys, shutil, struct, zlib

dist_dir = sys.argv[1]
zip_path = sys.argv[2]
poki_folder = sys.argv[3]

exclude_exts = {'.unitypackage', '.map', '.zip'}
exclude_names = {'.ds_store', 'thumbs.db'}

# 'vfx' runtime assets are bundled into assets.bin to eliminate Poki Inspector unoptimized file warnings
allowed_root_files = {'index.html', 'manifest.json', 'sw.js', 'favicon.svg', 'assets.bin', 'vite.svg', 'icons.svg'}
allowed_dirs = {'audio', 'fonts', 'fantasy_bg', 'ui', 'icons'}

sdk_dir = os.path.join(os.path.dirname(dist_dir), 'scripts')
files_to_pack = []
for sdk_name in ('poki-sdk.js', 'poki-sdk-core.js'):
    sdk_file = os.path.join(sdk_dir, sdk_name)
    assert os.path.isfile(sdk_file), f'Local Poki SDK missing: {sdk_name}'
    files_to_pack.append((sdk_file, sdk_name))

# 1. Root files (guarantee index.html is top-priority root)
for rf in allowed_root_files:
    fp = os.path.join(dist_dir, rf)
    if os.path.exists(fp):
        files_to_pack.append((fp, rf))

# 2. Active assets referenced by index.html (eliminates stale duplicate builds)
index_html_path = os.path.join(dist_dir, 'index.html')
if os.path.exists(index_html_path):
    with open(index_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    import re
    asset_matches = set(re.findall(r'(?:./)?assets/([a-zA-Z0-9_.-]+)', html_content))
    for af in asset_matches:
        if af.lower() in exclude_names or os.path.splitext(af)[1].lower() in exclude_exts:
            continue
        fp = os.path.join(dist_dir, 'assets', af)
        if os.path.exists(fp):
            files_to_pack.append((fp, f'assets/{af}'))

# 3. Whitelisted subdirectories
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

# 3. Hero portraits
portraits_dir = os.path.join(dist_dir, 'sprites', 'portraits')
if os.path.exists(portraits_dir):
    for f in os.listdir(portraits_dir):
        if f.endswith('.png'):
            fp = os.path.join(portraits_dir, f)
            files_to_pack.append((fp, f'sprites/portraits/{f}'))

# 4. Loader Character Sprites
for s in range(1, 9):
    fn = f'char_run_frame_{s}.png'
    fp = os.path.join(dist_dir, 'sprites', fn)
    if os.path.exists(fp):
        files_to_pack.append((fp, f'sprites/{fn}'))

def optimize_bundle(source):
    data = open(source, 'rb').read()
    assert data[:4] == b'STIK', 'Invalid asset bundle'
    count = struct.unpack_from('<I', data, 4)[0]
    index_size = struct.unpack_from('<I', data, 8)[0]
    index = memoryview(data)[12:12 + index_size]
    payload = memoryview(data)[12 + index_size:]
    entries = []
    cursor = 0
    for _ in range(count):
        name_size = struct.unpack_from('<H', index, cursor)[0]
        cursor += 2
        name = bytes(index[cursor:cursor + name_size])
        cursor += name_size
        offset, size = struct.unpack_from('<II', index, cursor)
        cursor += 8
        blob = bytes(payload[offset:offset + size])
        if b'Stick Figure Character Sprites 2D/' in name and blob.startswith(bytes.fromhex('89504e470d0a1a0a')):
            chunks = []
            compressed = []
            pos = 8
            while pos < len(blob):
                length = struct.unpack_from('>I', blob, pos)[0]
                tag = blob[pos + 4:pos + 8]
                chunk = blob[pos + 8:pos + 8 + length]
                if tag == b'IDAT':
                    compressed.append(chunk)
                else:
                    chunks.append((tag, chunk))
                pos += 12 + length
            assert pos == len(blob), name
            packed = zlib.compress(zlib.decompress(b''.join(compressed)), 6)
            rebuilt = bytearray(blob[:8])
            for tag, chunk in chunks:
                if tag == b'IEND':
                    rebuilt += struct.pack('>I', len(packed)) + b'IDAT' + packed + struct.pack('>I', zlib.crc32(b'IDAT' + packed))
                rebuilt += struct.pack('>I', len(chunk)) + tag + chunk + struct.pack('>I', zlib.crc32(tag + chunk))
            if len(rebuilt) < len(blob):
                blob = bytes(rebuilt)
        entries.append((name, blob))
    assert cursor == index_size
    table = bytearray()
    bodies = bytearray()
    for name, blob in entries:
        table += struct.pack('<H', len(name)) + name + struct.pack('<II', len(bodies), len(blob))
        bodies += blob
    return b'STIK' + struct.pack('<II', count, len(table)) + table + bodies

poki_fs_strip = """<script>
window.__POKI_BUILD__ = true;
window.IS_POKI = true;
if (typeof Element !== 'undefined' && Element.prototype) {
    Element.prototype.requestFullscreen = function() { return Promise.resolve(); };
    Element.prototype.webkitRequestFullscreen = function() { return Promise.resolve(); };
}
if (typeof Document !== 'undefined' && Document.prototype) {
    Document.prototype.exitFullscreen = function() { return Promise.resolve(); };
    Document.prototype.webkitExitFullscreen = function() { return Promise.resolve(); };
}
</script>
<style>
#fullscreen-hud-btn, #fullscreen-prompt, #menu-fullscreen-btn, #setting-fullscreen-row, #settings-fullscreen-btn, #pause-fullscreen-btn {
    display: none !important;
}
</style>
\"\"\"

with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for abs_path, rel_path in files_to_pack:
        dest_file = os.path.join(poki_folder, *rel_path.split('/'))
        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
        if rel_path == 'index.html':
            with open(abs_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if '<head>' in content:
                content = content.replace('<head>', '<head>' + poki_fs_strip + '<script defer src="./poki-sdk.js"></script>', 1)
            else:
                content = poki_fs_strip + content
            with open(dest_file, 'w', encoding='utf-8') as f:
                f.write(content)
            zf.writestr(rel_path, content.encode('utf-8'))
        elif rel_path == 'poki-sdk.js':
            content = open(abs_path, 'rb').read().replace(b'https://game-cdn.poki.com/scripts/\${e}/\${t}', b'./poki-sdk-core.js')
            assert b'./poki-sdk-core.js' in content, 'Poki SDK core URL changed'
            with open(dest_file, 'wb') as f:
                f.write(content)
            zf.writestr(rel_path, content)
        elif rel_path == 'assets.bin':
            content = optimize_bundle(abs_path)
            with open(dest_file, 'wb') as f:
                f.write(content)
            zf.writestr(rel_path, content)
        else:
            zf.write(abs_path, rel_path)
            shutil.copy2(abs_path, dest_file)

print(f"Poki ZIP packaged successfully with {len(files_to_pack)} runtime files: {zip_path}")
`;

const pyScriptPath = path.join(rootDir, '_poki_zip.py');
fs.writeFileSync(pyScriptPath, pythonScript, 'utf8');

try {
  execSync(`python "${pyScriptPath}" "${distDir}" "${zipPath}" "${pokiFolder}"`, {
    cwd: rootDir,
    stdio: 'inherit'
  });
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
console.log(`Tip: Drag the ZIP file '${zipPath}' directly into Poki Inspector drop area.`);
