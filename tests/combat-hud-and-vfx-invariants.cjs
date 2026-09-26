const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Combat HUD, Flow, Hero Scale & Level-Up VFX Invariants', async (t) => {
  await t.test('12 Level-Up VFX frames exist with valid PNG headers', () => {
    const vfxDir = path.join(__dirname, '..', 'public', 'vfx', 'level_up');
    assert.ok(fs.existsSync(vfxDir), 'public/vfx/level_up directory must exist');
    for (let i = 1; i <= 12; i++) {
      const frameNum = String(i).padStart(2, '0');
      const framePath = path.join(vfxDir, `frame_${frameNum}.png`);
      assert.ok(fs.existsSync(framePath), `frame_${frameNum}.png must exist`);
      const buf = fs.readFileSync(framePath);
      assert.ok(buf.length > 100, `frame_${frameNum}.png must be non-empty`);
      assert.equal(buf[0], 0x89, 'Byte 0 must be PNG signature');
      assert.equal(buf[1], 0x50, 'Byte 1 must be PNG signature');
      assert.equal(buf[2], 0x4E, 'Byte 2 must be PNG signature');
      assert.equal(buf[3], 0x47, 'Byte 3 must be PNG signature');
    }
  });

  await t.test('Aetherion Astral Shot bow icon fc1142.png exists in public/icons/rpg/', () => {
    const bowPath = path.join(__dirname, '..', 'public', 'icons', 'rpg', 'fc1142.png');
    assert.ok(fs.existsSync(bowPath), 'fc1142.png must exist in public/icons/rpg/');
    const stat = fs.statSync(bowPath);
    assert.ok(stat.size > 200, 'fc1142.png must be non-empty');
  });

  await t.test('Forbidden Grimoire modal has no locked ??? fusions', () => {
    const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.ts'), 'utf8');
    assert.doesNotMatch(uiSrc, /LOCKED FUSION/, 'ui.ts must not render LOCKED FUSION card placeholders');
    assert.doesNotMatch(uiSrc, /未解読の奥義/, 'ui.ts must not render Japanese locked fusion card placeholders');
  });

  await t.test('In-game action buttons use .rpg-icon-box and RPG icons', () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.match(indexHtml, /id="btn-dash"[\s\S]*?icons\/rpg\/fc888\.png/, 'btn-dash must use fc888.png');
    assert.match(indexHtml, /id="btn-attack"[\s\S]*?btn-slash\.(webp|png)/, 'btn-attack must use custom slash icon');
    assert.match(indexHtml, /id="btn-stance-switch"[\s\S]*?icons\/rpg\/fc1142\.png/, 'btn-stance-switch must use fc1142.png');
    assert.match(indexHtml, /action-btn-rpg-box/, 'Action buttons must use action-btn-rpg-box class');
  });

  await t.test('Level up toast is moved to left side and smaller', () => {
    const qolCss = fs.readFileSync(path.join(__dirname, '..', 'src', 'qol.css'), 'utf8');
    assert.match(qolCss, /#qol-toast\s*\{[^}]*left:\s*max\(/, 'qol-toast must be positioned relative to left safe area');
    assert.doesNotMatch(qolCss, /#qol-toast\s*\{[^}]*transform:\s*translateX\(-50%\)/, 'qol-toast must not be centered with translateX(-50%)');
  });

  await t.test('Dash cooldown increased by 1 second', () => {
    const globalsSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'globals.ts'), 'utf8');
    assert.match(globalsSrc, /dashCooldownBase:\s*2\.2/, 'dashCooldownBase must be increased to 2.2s');
  });

  await t.test('Flow max capacity increased to slow down fill up rate', () => {
    const globalsSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'globals.ts'), 'utf8');
    assert.match(globalsSrc, /flowMax:\s*450/, 'flowMax must be increased to 450 to slow down flow fill up rate');
  });

  await t.test('Hero Aetherion scale increased in entities.ts', () => {
    const entitiesSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'entities.ts'), 'utf8');
    assert.match(entitiesSrc, /this\.type\s*===\s*'heroaetherion'\)\s*\{\s*scale\s*\*=\s*9\./, 'heroaetherion scale must be increased to 9.+');
  });
});
