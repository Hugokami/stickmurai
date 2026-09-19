const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'C:\\Users\\lyan1\\Desktop\\game assets\\Free - Raven Fantasy Icons\\Free - Raven Fantasy Icons\\Separated Files\\64x64';
const DEST_DIR = path.resolve(__dirname, '../public/icons/rpg');

const REQUIRED_ICONS = [
  'fc20.png',
  'fc543.png',
  'fc888.png',
  'fc894.png',
  'fc1025.png',
  'fc1031.png',
  'fc1038.png',
  'fc1043.png',
  'fc1052.png',
  'fc1064.png',
  'fc1101.png',
  'fc1120.png',
  'fc1132.png',
  'fc1150.png',
  'fc1155.png',
  'fc1170.png',
  'fc1191.png',
  'fc1207.png',
  'fc1220.png',
  'fc1221.png',
  'fc1223.png',
  'fc1225.png',
  'fc1228.png',
  'fc1230.png',
  'fc1234.png',
  'fc1237.png',
  'fc1267.png',
  'fc1276.png',
  'fc1328.png',
  'fc1388.png'
];

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`Source directory not found: ${SOURCE_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

let copied = 0;
for (const icon of REQUIRED_ICONS) {
  const src = path.join(SOURCE_DIR, icon);
  const dest = path.join(DEST_DIR, icon);
  if (!fs.existsSync(src)) {
    console.error(`Missing icon in source: ${icon}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  copied++;
}

console.log(`Successfully synced ${copied} RPG fantasy icons to ${DEST_DIR}`);
