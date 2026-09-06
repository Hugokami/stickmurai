const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const dir = path.resolve(__dirname, '..', 'public', 'vfx', 'slashes', 'slash_akakage');
const source = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '..', 'raw_assets', 'akakage_slash_source.png')));
const size = 128;

for (let frame = 0; frame < 8; frame++) {
  const x0 = Math.round(frame * source.width / 8);
  const x1 = Math.round((frame + 1) * source.width / 8);
  let minX = x1, minY = source.height, maxX = x0 - 1, maxY = -1;
  for (let y = 0; y < source.height; y++) for (let x = x0; x < x1; x++) {
    if (source.data[(y * source.width + x) * 4 + 3] > 8) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  const out = new PNG({ width: size, height: size });
  out.data.fill(0);
  if (maxX >= minX) {
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const scale = Math.min(112 / w, 112 / h, 1);
    const dw = Math.max(1, Math.round(w * scale));
    const dh = Math.max(1, Math.round(h * scale));
    const ox = Math.round((size - dw) / 2);
    const oy = Math.round((size - dh) / 2);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const sx = minX + Math.min(w - 1, Math.floor(x / scale));
      const sy = minY + Math.min(h - 1, Math.floor(y / scale));
      const src = (sy * source.width + sx) * 4;
      const dst = ((oy + y) * size + ox + x) * 4;
      out.data[dst] = source.data[src];
      out.data[dst + 1] = source.data[src + 1];
      out.data[dst + 2] = source.data[src + 2];
      out.data[dst + 3] = source.data[src + 3];
    }
  }
  fs.writeFileSync(path.join(dir, `frame_${String(frame + 1).padStart(2, '0')}.png`), PNG.sync.write(out));
}
console.log('Akakage slash frames written');
