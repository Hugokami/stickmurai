const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');

test('scripts/build-portal.cjs enforces itch.io 1000-file ceiling for html5 target', () => {
  const buildPortalSrc = fs.readFileSync(path.join(rootDir, 'scripts/build-portal.cjs'), 'utf8');
  assert.match(buildPortalSrc, /target === 'html5'/, 'must contain explicit html5 branching');
  assert.match(buildPortalSrc, /totalFiles > 1000/, 'must enforce itch.io 1000 file limit check');
  assert.match(buildPortalSrc, /(?:muramasa-itch\.zip|MURAMASA\.EXE)/, 'must create muramasa-itch.zip or MURAMASA.EXE bundle alias');
});

test('package.json provides package:itch script alias', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts['package:itch'], 'package:itch script must exist');
  assert.match(pkg.scripts['package:itch'], /build-portal\.cjs.*html5/, 'package:itch must invoke build-portal with html5');
});

test('itch.io release zip packages are strictly under 1,000 files', () => {
  const html5ZipPath = path.join(rootDir, 'release/muramasa-html5.zip');
  const itchZipPath = path.join(rootDir, 'release/muramasa-itch.zip');
  const muramasaExeZipPath = path.join(rootDir, 'release/MURAMASA.EXE.zip');

  assert.ok(fs.existsSync(html5ZipPath), 'release/muramasa-html5.zip must exist');
  assert.ok(fs.existsSync(itchZipPath), 'release/muramasa-itch.zip must exist');
  assert.ok(fs.existsSync(muramasaExeZipPath), 'release/MURAMASA.EXE.zip must exist');

  const pyCheck = `
import sys, zipfile

for p in [r"${html5ZipPath}", r"${itchZipPath}", r"${muramasaExeZipPath}"]:
    with zipfile.ZipFile(p, 'r') as zf:
        names = zf.namelist()
        count = len(names)
        assert count < 1000, f"File count {count} exceeds 1000 limit in {p}"
        assert 'index.html' in names, f"index.html missing at root of {p}"
        assert 'assets.bin' in names, f"assets.bin missing at root of {p}"
        assert any(n.startswith('assets/') and n.endswith('.js') for n in names), f"JS bundle missing in {p}"
        assert any(n.startswith('assets/') and n.endswith('.css') for n in names), f"CSS bundle missing in {p}"
        assert any(n.startswith('audio/') for n in names), f"Audio assets missing in {p}"
        assert any(n.startswith('fonts/') for n in names), f"Fonts missing in {p}"
        assert any(n.startswith('icons/rpg/') for n in names), f"RPG icons missing in {p}"
print("ZIP_VERIFIED")
`;

  const { execFileSync } = require('node:child_process');
  const out = execFileSync('python', ['-c', pyCheck], { cwd: rootDir }).toString();
  assert.match(out, /ZIP_VERIFIED/, 'both html5 and itch zip packages must pass verification');
});
