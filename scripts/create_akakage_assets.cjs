const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const downloads = 'C:/Users/lyan1/Downloads';
const outputDir = path.join(root, 'public', 'sprites', 'HeroAkakage');
const portraitDir = path.join(root, 'public', 'sprites', 'portraits');
const canvasSize = 128;

const sources = {
  idle: path.join(downloads, 'ChatGPT Image Sep 5, 2026, 11_35_47 PM.png'),
  attack: path.join(downloads, 'ChatGPT Image Sep 5, 2026, 11_43_09 PM.png'),
  walk: path.join(downloads, 'ChatGPT Image Sep 5, 2026, 11_49_58 PM.png'),
  mixed: path.join(downloads, 'ChatGPT Image Sep 6, 2026, 12_22_06 AM.png')
};

for (const file of Object.values(sources)) {
  if (!fs.existsSync(file)) throw new Error(`Missing source image: ${file}`);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(portraitDir, { recursive: true });

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function cropCell(sheet, x0, y0, x1, y1) {
  let minX = x1;
  let minY = y1;
  let maxX = x0 - 1;
  let maxY = y0 - 1;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (sheet.data[(y * sheet.width + x) * 4 + 3] > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) return null;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcStart = ((minY + y) * sheet.width + minX) * 4;
    sheet.data.copy(pixels, y * width * 4, srcStart, srcStart + width * 4);
  }
  return cleanBackground(keepLargestComponent({ width, height, data: pixels }));
}

function keepLargestComponent(frame) {
  const seen = new Uint8Array(frame.width * frame.height);
  let best = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const start = y * frame.width + x;
      if (seen[start] || frame.data[start * 4 + 3] <= 8) continue;
      const queue = [start];
      const component = [];
      seen[start] = 1;
      for (let q = 0; q < queue.length; q++) {
        const i = queue[q];
        component.push(i);
        const cx = i % frame.width;
        const cy = (i / frame.width) | 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (!ox && !oy) continue;
            const nx = cx + ox;
            const ny = cy + oy;
            if (nx < 0 || ny < 0 || nx >= frame.width || ny >= frame.height) continue;
            const ni = ny * frame.width + nx;
            if (!seen[ni] && frame.data[ni * 4 + 3] > 8) { seen[ni] = 1; queue.push(ni); }
          }
        }
      }
      if (component.length > best.length) best = component;
    }
  }
  const keep = new Uint8Array(frame.width * frame.height);
  best.forEach(i => { keep[i] = 1; });
  for (let i = 0; i < keep.length; i++) if (!keep[i]) frame.data[i * 4 + 3] = 0;
  return frame;
}

function cleanBackground(frame) {
  // The generated sheets keep a red lighting wash in some cells. Remove only
  // the edge-connected wash; opaque neutral pixels are protected so Akakage's
  // black armor and outline remain intact.
  const visited = new Uint8Array(frame.width * frame.height);
  const queue = [];
  const push = (x, y) => {
    const i = y * frame.width + x;
    if (!visited[i]) { visited[i] = 1; queue.push(i); }
  };
  for (let x = 0; x < frame.width; x++) { push(x, 0); push(x, frame.height - 1); }
  for (let y = 1; y < frame.height - 1; y++) { push(0, y); push(frame.width - 1, y); }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    const x = i % frame.width;
    const y = (i / frame.width) | 0;
    const src = i * 4;
    const r = frame.data[src];
    const g = frame.data[src + 1];
    const b = frame.data[src + 2];
    frame.data[src + 3] = 0;
    const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= frame.width || ny >= frame.height) continue;
      const ni = ny * frame.width + nx;
      if (visited[ni]) continue;
      const dst = ni * 4;
      const a = frame.data[dst + 3];
      const nr = frame.data[dst];
      const ng = frame.data[dst + 1];
      const nb = frame.data[dst + 2];
      const neutralOpaque = a > 180 && Math.max(nr, ng, nb) < 90 && Math.max(nr, ng, nb) - Math.min(nr, ng, nb) < 24;
      const distance = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
      if (!neutralOpaque && (a < 32 || distance <= 48)) push(nx, ny);
    }
  }
  // A few cells contain an opaque, low-intensity red vignette behind the
  // fighter. It is visually distinct from the bright crimson costume pixels.
  for (let i = 0; i < frame.width * frame.height; i++) {
    const p = i * 4;
    const r = frame.data[p];
    const g = frame.data[p + 1];
    const b = frame.data[p + 2];
    if (frame.data[p + 3] > 0 && r > g * 1.65 && r > b * 1.45 && r < 140 && g < 34) {
      frame.data[p + 3] = 0;
    }
  }
  return frame;
}

function normalize(frame) {
  const out = new PNG({ width: canvasSize, height: canvasSize });
  out.data.fill(0);
  if (!frame) return out;

  // Keep each pose inside the same footprint. The bottom anchor is fixed so
  // idle, walk, attack, and dash never make the player bob or drift.
  const scale = Math.min(112 / frame.width, 108 / frame.height, 1);
  const width = Math.max(1, Math.round(frame.width * scale));
  const height = Math.max(1, Math.round(frame.height * scale));
  const left = Math.round((canvasSize - width) / 2);
  const top = canvasSize - 12 - height;
  // Nearest-neighbor resampling keeps the supplied pixel art crisp.
  for (let y = 0; y < height; y++) {
    const sy = Math.min(frame.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(frame.width - 1, Math.floor(x / scale));
      const src = (sy * frame.width + sx) * 4;
      const dstX = left + x;
      const dstY = top + y;
      if (dstX < 0 || dstY < 0 || dstX >= canvasSize || dstY >= canvasSize) continue;
      const dst = (dstY * canvasSize + dstX) * 4;
      out.data[dst] = frame.data[src];
      out.data[dst + 1] = frame.data[src + 1];
      out.data[dst + 2] = frame.data[src + 2];
      out.data[dst + 3] = frame.data[src + 3];
    }
  }
  return out;
}

function saveFrame(kind, index, frame) {
  const filename = `${kind}${String(index).padStart(2, '0')}.png`;
  fs.writeFileSync(path.join(outputDir, filename), PNG.sync.write(normalize(frame)));
}

function horizontalFrames(sheet, count) {
  return Array.from({ length: count }, (_, i) => cropCell(
    sheet,
    Math.round(i * sheet.width / count),
    0,
    Math.round((i + 1) * sheet.width / count),
    sheet.height
  ));
}

function gridFrames(sheet, cols, rows) {
  const result = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      result.push(cropCell(
        sheet,
        Math.round(col * sheet.width / cols),
        Math.round(row * sheet.height / rows),
        Math.round((col + 1) * sheet.width / cols),
        Math.round((row + 1) * sheet.height / rows)
      ));
    }
  }
  return result;
}

const idleStrip = horizontalFrames(readPng(sources.idle), 10);
const attackCloseups = horizontalFrames(readPng(sources.attack), 2);
const walk = gridFrames(readPng(sources.walk), 4, 6);
const mixed = gridFrames(readPng(sources.mixed), 4, 6);

// Use every supplied pose: the first strip and the neutral rows become a
// longer idle loop; crouches are the attack; streak poses are the dash.
const idle = idleStrip.concat(mixed.slice(0, 8), mixed.slice(20, 24));
// The close-up reference image has an opaque black presentation backdrop, so
// the playable attack uses the transparent crouch/strike row from the mixed
// sheet. The close-up remains a visual reference for the generated slash VFX.
const attack = mixed.slice(8, 12);
const dash = mixed.slice(12, 16).concat(mixed.slice(16, 18));
const hit = mixed.slice(18, 20);
const dead = mixed.slice(18, 20);

for (const [kind, frames] of Object.entries({ idle, attack, walk, dash, hit, dead })) {
  frames.forEach((frame, index) => saveFrame(kind, index + 1, frame));
}

// The first normalized idle frame is a clean, transparent dojo portrait.
const portrait = PNG.sync.read(fs.readFileSync(path.join(outputDir, 'idle01.png')));
fs.writeFileSync(path.join(portraitDir, 'portrait_akakage.png'), PNG.sync.write(portrait));

console.log(`Akakage assets written to ${outputDir}`);
console.log(`idle=${idle.length} attack=${attack.length} walk=${walk.length} dash=${dash.length} hit=${hit.length} dead=${dead.length}`);
