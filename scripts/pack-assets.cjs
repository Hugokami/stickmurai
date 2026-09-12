const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

// Base directory for reading assets (use dist if available, else public)
const sourceDir = fs.existsSync(distDir) ? distDir : publicDir;

console.log('--- Packing game assets into assets.bin ---');

const filesToPack = new Set();

// 1. All hero & enemy sprites
const spriteFolders = [
  'BossAgis',
  'BossSkeleton',
  'Enemy01',
  'Enemy02',
  'Enemy03',
  'Enemy05',
  'EnemyBarrel',
  'EnemyOrc',
  'EnemyToasterBot',
  'EvilWizard',
  'HeroAkakage',
  'HeroLuneblade',
  'HeroNightborne',
  'HeroNinja',
  'HeroSamurai',
  'HeroSatyr',
  'portraits'
];

for (const folder of spriteFolders) {
  const dir = path.join(sourceDir, 'sprites', folder);
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.png') || f.endsWith('.svg')) {
        filesToPack.add(`sprites/${folder}/${f}`);
      }
    }
  }
}

// 2. 8 loader frames
for (let i = 1; i <= 8; i++) {
  const rel = `sprites/Stick Figure Character Sprites 2D/Sword sprites/sword_Idle_000${i}.png`;
  if (fs.existsSync(path.join(sourceDir, rel))) {
    filesToPack.add(rel);
  }
}

// 3. Fantasy backgrounds
const bgDir = path.join(sourceDir, 'fantasy_bg');
if (fs.existsSync(bgDir)) {
  for (const f of fs.readdirSync(bgDir)) {
    if (f.endsWith('.png')) {
      filesToPack.add(`fantasy_bg/${f}`);
    }
  }
}

// 4. Icons
for (const icon of [
  'release_v1.2-single_38.png',
  'release_v1.2-single_15.png',
  'release_v1.2-single_77.png',
  'release_v1.2-single_5.png',
  'release_v1.2-single_88.png',
  'release_v1.2-single_1.png'
]) {
  const rel = `icons/${icon}`;
  if (fs.existsSync(path.join(sourceDir, rel))) {
    filesToPack.add(rel);
  }
}

// 5. Scan assets.ts for all referenced VFX animations
const assetsCode = fs.readFileSync(path.join(rootDir, 'src/assets.ts'), 'utf8');
const vfxRegex = /loadVfxFrames\(\s*'([^']+)',\s*(\d+)(?:,\s*(\d+))?(?:,\s*(\d+))?/g;
let match;
while ((match = vfxRegex.exec(assetsCode)) !== null) {
  const pattern = match[1];
  // Skip unused categories
  if (pattern.includes('vfx/ui/')) continue;
  const count = parseInt(match[2], 10);
  const start = parseInt(match[3] || '1', 10);
  const pad = parseInt(match[4] || '0', 10);
  for (let i = 0; i < count; i++) {
    const num = start + i;
    const numStr = pad > 0 ? num.toString().padStart(pad, '0') : num.toString();
    const rel = pattern.replace('{N}', numStr);
    if (fs.existsSync(path.join(sourceDir, rel))) {
      filesToPack.add(rel);
    }
  }
}

const fileList = Array.from(filesToPack).sort();
console.log(`Discovered ${fileList.length} required assets to bundle into binary archive.`);

// Build Binary Archive
// Header: "STIK" (4 bytes) + fileCount (uint32, 4 bytes) + indexByteLength (uint32, 4 bytes)
// Index: For each file:
//   pathLength (uint16) + path (UTF-8 bytes) + dataOffset (uint32) + dataLength (uint32)
// Data: Concatenated raw file bytes

const encoder = new TextEncoder();
const indexParts = [];
const dataBuffers = [];
let currentOffset = 0;

for (const rel of fileList) {
  const full = path.join(sourceDir, rel);
  const fileBuf = fs.readFileSync(full);
  const pathBytes = encoder.encode(rel);

  const entryHeader = Buffer.alloc(2 + pathBytes.length + 4 + 4);
  entryHeader.writeUInt16LE(pathBytes.length, 0);
  Buffer.from(pathBytes).copy(entryHeader, 2);
  entryHeader.writeUInt32LE(currentOffset, 2 + pathBytes.length);
  entryHeader.writeUInt32LE(fileBuf.length, 2 + pathBytes.length + 4);

  indexParts.push(entryHeader);
  dataBuffers.push(fileBuf);
  currentOffset += fileBuf.length;
}

const indexBuffer = Buffer.concat(indexParts);
const dataBuffer = Buffer.concat(dataBuffers);

const mainHeader = Buffer.alloc(12);
mainHeader.write('STIK', 0, 4, 'ascii');
mainHeader.writeUInt32LE(fileList.length, 4);
mainHeader.writeUInt32LE(indexBuffer.length, 8);

const finalArchive = Buffer.concat([mainHeader, indexBuffer, dataBuffer]);

// Write to public/assets.bin and dist/assets.bin (if dist exists)
fs.writeFileSync(path.join(publicDir, 'assets.bin'), finalArchive);
console.log(`Wrote ${path.join(publicDir, 'assets.bin')} (${(finalArchive.length / (1024 * 1024)).toFixed(2)} MB)`);

if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'assets.bin'), finalArchive);
  console.log(`Wrote ${path.join(distDir, 'assets.bin')} (${(finalArchive.length / (1024 * 1024)).toFixed(2)} MB)`);
}

console.log('Asset packing complete!\n');
