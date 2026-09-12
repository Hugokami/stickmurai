const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

// Prefer source files from dist if built, otherwise public
const sourceDir = fs.existsSync(distDir) ? distDir : publicDir;

console.log('--- Comprehensive Asset Packing into assets.bin ---');

const filesToPack = new Set();

// 1. Pack EVERYTHING in sprites/
const spritesDir = path.join(sourceDir, 'sprites');
if (fs.existsSync(spritesDir)) {
  function scanDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
      } else if (entry.name.endsWith('.png') || entry.name.endsWith('.svg')) {
        const rel = path.relative(sourceDir, full).replace(/\\/g, '/');
        filesToPack.add(rel);
      }
    }
  }
  scanDir(spritesDir);
}

// 2. Pack EVERYTHING in fantasy_bg/
const bgDir = path.join(sourceDir, 'fantasy_bg');
if (fs.existsSync(bgDir)) {
  for (const f of fs.readdirSync(bgDir)) {
    if (f.endsWith('.png') || f.endsWith('.svg')) {
      const rel = path.relative(sourceDir, path.join(bgDir, f)).replace(/\\/g, '/');
      filesToPack.add(rel);
    }
  }
}

// 3. Pack EVERYTHING in icons/
const iconDir = path.join(sourceDir, 'icons');
if (fs.existsSync(iconDir)) {
  for (const f of fs.readdirSync(iconDir)) {
    if (f.endsWith('.png') || f.endsWith('.svg')) {
      const rel = path.relative(sourceDir, path.join(iconDir, f)).replace(/\\/g, '/');
      filesToPack.add(rel);
    }
  }
}

// 4. Scan assets.ts for all referenced VFX animations
const assetsCode = fs.readFileSync(path.join(rootDir, 'src/assets.ts'), 'utf8');

// A. loadVfxFrames('pattern', count, start, pad)
const vfxRegex = /loadVfxFrames\(\s*'([^']+)',\s*(\d+)(?:,\s*(\d+))?(?:,\s*(\d+))?/g;
let match;
while ((match = vfxRegex.exec(assetsCode)) !== null) {
  const pattern = match[1];
  const count = parseInt(match[2], 10);
  const start = parseInt(match[3] || '1', 10);
  const pad = parseInt(match[4] || '0', 10);
  for (let i = 0; i < count; i++) {
    const num = start + i;
    const numStr = pad > 0 ? num.toString().padStart(pad, '0') : num.toString();
    const rel = pattern.replace('{N}', numStr);
    if (fs.existsSync(path.join(sourceDir, rel))) {
      filesToPack.add(rel);
    } else if (fs.existsSync(path.join(publicDir, rel))) {
      filesToPack.add(rel);
    }
  }
}

// B. Any explicit vfx string literals in assets.ts or powerups.ts
const explicitVfxRegex = /'((?:vfx|sprites)\/[^']+\.(?:png|svg))'/g;
while ((match = explicitVfxRegex.exec(assetsCode)) !== null) {
  const rel = match[1];
  if (fs.existsSync(path.join(sourceDir, rel))) {
    filesToPack.add(rel);
  } else if (fs.existsSync(path.join(publicDir, rel))) {
    filesToPack.add(rel);
  }
}

console.log(`Discovered ${filesToPack.size} total required game assets to bundle into assets.bin.`);

// Binary packaging:
// Header:
// 4 bytes: Magic 'STIK'
// 4 bytes: uint32 fileCount
// 4 bytes: uint32 indexByteLength
// Index table:
// For each file:
//   2 bytes: uint16 pathLength
//   pathLength bytes: utf-8 path
//   4 bytes: uint32 dataOffset
//   4 bytes: uint32 dataLength
// Data section:
//   concatenated file bytes

const filesArray = Array.from(filesToPack).sort();
const fileBuffers = [];
const indexEntries = [];

let currentOffset = 0;
for (const rel of filesArray) {
  let full = path.join(sourceDir, rel);
  if (!fs.existsSync(full)) {
    full = path.join(publicDir, rel);
  }
  const buf = fs.readFileSync(full);
  fileBuffers.push(buf);

  const pathBuf = Buffer.from(rel, 'utf8');
  indexEntries.push({
    pathBuf,
    offset: currentOffset,
    length: buf.length
  });
  currentOffset += buf.length;
}

// Calculate index length
let indexLength = 0;
for (const entry of indexEntries) {
  indexLength += 2 + entry.pathBuf.length + 4 + 4;
}

const headerBuf = Buffer.alloc(12);
headerBuf.write('STIK', 0, 4, 'ascii');
headerBuf.writeUInt32LE(filesArray.length, 4);
headerBuf.writeUInt32LE(indexLength, 8);

const indexBuf = Buffer.alloc(indexLength);
let idxPos = 0;
for (const entry of indexEntries) {
  indexBuf.writeUInt16LE(entry.pathBuf.length, idxPos);
  idxPos += 2;
  entry.pathBuf.copy(indexBuf, idxPos);
  idxPos += entry.pathBuf.length;
  indexBuf.writeUInt32LE(entry.offset, idxPos);
  idxPos += 4;
  indexBuf.writeUInt32LE(entry.length, idxPos);
  idxPos += 4;
}

const totalBundleSize = 12 + indexLength + currentOffset;
console.log(`Creating bundle with total size: ${(totalBundleSize / (1024 * 1024)).toFixed(2)} MB`);

const outDist = path.join(distDir, 'assets.bin');
const outPublic = path.join(publicDir, 'assets.bin');

const writeStream = (targetPath) => {
  const ws = fs.createWriteStream(targetPath);
  ws.write(headerBuf);
  ws.write(indexBuf);
  for (const b of fileBuffers) {
    ws.write(b);
  }
  ws.end();
};

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
writeStream(outPublic);
console.log(`Wrote ${outPublic} (${(totalBundleSize / (1024 * 1024)).toFixed(2)} MB)`);

if (fs.existsSync(distDir)) {
  writeStream(outDist);
  console.log(`Wrote ${outDist} (${(totalBundleSize / (1024 * 1024)).toFixed(2)} MB)`);
}

console.log('Comprehensive asset packing complete!');
