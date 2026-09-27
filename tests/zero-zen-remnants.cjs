const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('zero zen remnants invariant', () => {
  const filesToCheck = [
    'src/globals.ts',
    'src/enemy.ts',
    'src/main.ts',
    'src/ui.ts',
    'src/powerups.ts',
    'src/shrine.ts',
    'src/entities.ts',
    'src/renderer.ts',
    'src/input.ts',
    'index.html'
  ];

  for (const rel of filesToCheck) {
    const fullPath = path.resolve(__dirname, '..', rel);
    let content = fs.readFileSync(fullPath, 'utf8');
    if (rel.endsWith('.html')) {
      content = content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '');
    }
    // Ensure no standalone 'zen' words or 'zenField' or 'gameMode === "zen"'
    const matches = content.match(/\bzen\b|zenField|gameMode\s*===\s*['"]zen['"]/i);
    assert.equal(matches, null, `Found forbidden zen reference in ${rel}: ${matches ? matches[0] : ''}`);
  }
});
