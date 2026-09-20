const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

test('Akakage Hero Alignment: sprite center offset, shadow elevation, and indicator ring', () => {
  const entitiesSrc = fs.readFileSync(path.join(projectRoot, 'src', 'entities.ts'), 'utf-8');
  const playerSrc = fs.readFileSync(path.join(projectRoot, 'src', 'player.ts'), 'utf-8');
  const rendererSrc = fs.readFileSync(path.join(projectRoot, 'src', 'renderer.ts'), 'utf-8');

  // Akakage sprite horizontal offset in entities.ts centers feet with origin
  assert.match(entitiesSrc, /const akakageOffsetX\s*=\s*\(this\.type\s*===\s*'heroakakage'\s*\?\s*-5\.5\s*:\s*0\)\s*\*\s*scale/);
  assert.match(entitiesSrc, /Math\.round\(-img\.width\/2\s*\*\s*scale\s*\+\s*aethOffsetX\s*\+\s*akakageOffsetX\)/);

  // Akakage ghost trail color is crimson and includes ghost offset
  assert.match(entitiesSrc, /else if \(this\.type === 'heroakakage'\) trailColor = '#ef4444';/);
  assert.match(entitiesSrc, /this\.type === 'heroakakage'\s*\?\s*-5\.5/);

  // Akakage foot offset in player.ts is calibrated to 125 (ground contact line)
  assert.match(playerSrc, /this\.type === 'heroakakage'\s*\?\s*125/);

  // Akakage aura is centered at chest level py + 45, not floating in the sky
  assert.match(playerSrc, /const auraY = this\.type === 'heroakakage'\s*\?\s*\(py \+ 45\)\s*:\s*\(py - 10\);/);

  // Renderer baseFoot for Akakage Y-depth sorting is 125
  assert.match(rendererSrc, /case 'heroakakage':\s*baseFoot\s*=\s*125;\s*break;/);
});
