const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Honor Revive preserves boss and applies divine repel instead of wiping enemies', () => {
  const mainTsPath = path.join(__dirname, '..', 'src', 'main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');

  // Verify revivePlayer exists
  const reviveMatch = mainTs.match(/export function revivePlayer\(\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(reviveMatch, 'revivePlayer function must exist');
  const reviveBody = reviveMatch[1];

  // Ensure revivePlayer does NOT clear globals.enemies to empty array
  assert.ok(
    !reviveBody.includes('globals.enemies = [];'),
    'revivePlayer must not blindly clear globals.enemies to empty array'
  );

  // Ensure boss preservation and repel logic is implemented
  assert.ok(
    reviveBody.includes('isBossMob ? 520 : 650'),
    'revivePlayer must push enemies away with breathing room distance'
  );
  assert.ok(
    reviveBody.includes('e.stunTimer = Math.max(e.stunTimer || 0, 1.8);'),
    'revivePlayer must stun repelled enemies'
  );

  // Ensure boss respawn watchdog exists if boss was missing in boss stage
  assert.ok(
    reviveBody.includes('if (isBossStage && isFinalWave && !globals.stageBossDefeated && !bossAlive)'),
    'revivePlayer must have a watchdog to respawn boss if missing in boss stage'
  );
});
