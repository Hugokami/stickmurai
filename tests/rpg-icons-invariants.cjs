const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

test('RPG Icons Invariants: asset existence and valid PNG header', () => {
  const rpgDir = path.join(ROOT, 'public/icons/rpg');
  assert(fs.existsSync(rpgDir), 'public/icons/rpg directory exists');
  
  const fc888Path = path.join(rpgDir, 'fc888.png');
  assert(fs.existsSync(fc888Path), 'fc888.png movement icon exists');
  
  const buf = fs.readFileSync(fc888Path);
  assert.equal(buf[0], 0x89);
  assert.equal(buf[1], 0x50); // P
  assert.equal(buf[2], 0x4e); // N
  assert.equal(buf[3], 0x47); // G
});

test('RPG Icons Invariants: Combat guide movement card uses fc888.png', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /icons\/rpg\/fc888\.png|fc888\.png/, 'index.html movement section references fc888.png');
});

test('RPG Icons Invariants: No legacy emoji icons in core skill and ascension data', () => {
  const assetsTs = fs.readFileSync(path.join(ROOT, 'src/assets.ts'), 'utf8');
  assert(!assetsTs.includes("icon: '⚔️'"), 'skillsData in assets.ts does not use raw emoji');
  
  const balanceTs = fs.readFileSync(path.join(ROOT, 'src/balance.ts'), 'utf8');
  assert(!balanceTs.includes("icon: '⚡'"), 'HERO_AWAKENING_SKILLS does not use raw lightning emoji');

  const uiTs = fs.readFileSync(path.join(ROOT, 'src/ui.ts'), 'utf8');
  assert(!uiTs.includes("icon: '🗡️'"), 'ASCENSION_UPGRADES does not use raw sword emoji');
});

test('RPG Icons Invariants: CSS defines .rpg-icon-box and opacity controls', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/style.css'), 'utf8');
  assert.match(css, /\.rpg-icon-box/, 'style.css defines .rpg-icon-box');
  assert.match(css, /--rpg-icon-opacity/, 'style.css defines --rpg-icon-opacity variable');
  assert.match(css, /\.rpg-text-upperlayer/, 'style.css defines upperlayer text protection');
});

test('RPG Icons Invariants: Main menu cards reference curated RPG fantasy icons', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /icons\/rpg\/fc1038\.png/, 'Hero button references fc1038 flaming blade');
  assert.match(html, /icons\/rpg\/fc38\.png/, 'Dojo button references fc38 shrine pavilion');
  assert.match(html, /icons\/rpg\/fc1044\.png/, 'Upgrades button references fc1044 golden spark hammer');
  assert.match(html, /icons\/rpg\/fc292\.png/, 'Grimoire button references fc292 celestial star tome');
  assert.match(html, /icons\/rpg\/fc110\.png/, 'Chronicle button references fc110 red-bound scroll');
  assert.match(html, /icons\/rpg\/fc1295\.png/, 'Codex button references fc1295 reptilian eye tile');
  assert.match(html, /icons\/rpg\/fc2\.png/, 'Settings button references fc2 clockwork gear');
});

