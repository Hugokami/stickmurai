const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const sourceDir = 'C:/Users/lyan1/AppData/Local/Temp/stickmurai-martial-hero-20260906/Martial Hero/Sprites';
const outDir = path.join(root, 'public', 'sprites', 'HeroAkakage');
const size = 128;

const sets = {
  idle: ['Idle.png', 8],
  walk: ['Run.png', 8],
  attack: ['Attack1.png', 6],
  attack2: ['Attack2.png', 6],
  dash: ['Fall.png', 2],
  jump: ['Jump.png', 2],
  hit: ['Take Hit.png', 4],
  dead: ['Death.png', 6]
};

fs.mkdirSync(outDir, { recursive: true });

function normalize(sheet, index, count) {
  const x0 = Math.round(index * sheet.width / count);
  const x1 = Math.round((index + 1) * sheet.width / count);
  let minX = x1, minY = sheet.height, maxX = x0 - 1, maxY = -1;
  for (let y = 0; y < sheet.height; y++) for (let x = x0; x < x1; x++) {
    if (sheet.data[(y * sheet.width + x) * 4 + 3] > 8) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  const out = new PNG({ width: size, height: size });
  out.data.fill(0);
  if (maxX < minX) return out;
  const w = maxX - minX + 1, h = maxY - minY + 1;
  const scale = Math.min(112 / w, 112 / h, 1);
  const dw = Math.max(1, Math.round(w * scale)), dh = Math.max(1, Math.round(h * scale));
  const ox = Math.round((size - dw) / 2), oy = size - 12 - dh;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const sx = minX + Math.min(w - 1, Math.floor(x / scale));
    const sy = minY + Math.min(h - 1, Math.floor(y / scale));
    const src = (sy * sheet.width + sx) * 4;
    const dst = ((oy + y) * size + ox + x) * 4;
    out.data[dst] = sheet.data[src]; out.data[dst + 1] = sheet.data[src + 1];
    out.data[dst + 2] = sheet.data[src + 2]; out.data[dst + 3] = sheet.data[src + 3];
  }
  return out;
}

for (const [name, [file, count]] of Object.entries(sets)) {
  const sheet = PNG.sync.read(fs.readFileSync(path.join(sourceDir, file)));
  for (let i = 0; i < count; i++) {
    fs.writeFileSync(path.join(outDir, `${name}${String(i + 1).padStart(2, '0')}.png`), PNG.sync.write(normalize(sheet, i, count)));
  }
}

// Attack1 and Attack2 are one continuous 12-frame attack animation.
for (let i = 1; i <= 6; i++) {
  fs.copyFileSync(path.join(outDir, `attack2${String(i).padStart(2, '0')}.png`), path.join(outDir, `attack${String(i + 6).padStart(2, '0')}.png`));
}
for (let i = 1; i <= 6; i++) fs.unlinkSync(path.join(outDir, `attack2${String(i).padStart(2, '0')}.png`));

fs.copyFileSync(path.join(outDir, 'idle01.png'), path.join(root, 'public', 'sprites', 'portraits', 'portrait_akakage.png'));
console.log('Martial Hero assets sliced into HeroAkakage');
