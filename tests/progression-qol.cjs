const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const globals = { currentLang:'en', selectedHero:'default', chosenPowerUps:['puFeatherName'], playerStats:{dashCooldownBase:1.2, slashSizeMult:2.15, attackCooldownBase:.19, vampireChance:.06}, maxLives:5, lives:3, petalArmorLevel:0, echoLevel:0, tempoMasteryLevel:0 };
const output = stripTypeScriptTypes(fs.readFileSync('src/progressionQol.ts','utf8')).replace(/^import .*;$/gm, '').replace(/export function /g, 'function ') + '\nmodule.exports = { upgradePreview, permanentPreview, heroComparison };';
const mod={exports:{}};
new Function('globals','safeStorage','module',output)(globals,{getItem:()=>null},mod);
const {upgradePreview,permanentPreview,heroComparison}=mod.exports;
test('upgrade projections show actual cooldown and clamp without mutating live state',()=>{
 const before=JSON.stringify(globals);
 assert.match(upgradePreview('puFeatherName'),/1.2s → 1.08s/);
 assert.match(upgradePreview('puFeatherName'),/Acquired: 1/);
 assert.match(upgradePreview('puGiantName'),/2.15 → 2.2/);
 assert.match(upgradePreview('puWindName'),/0.19s → 0.18s/);
 upgradePreview('puCursedGlassName');
 assert.equal(JSON.stringify(globals),before);
});
test('permanent dash upgrade reports seconds and maximum rank stops increasing',()=>{
 assert.match(permanentPreview('dashCooldown',4,5,false),/0.32s → 0.4s/);
 assert.match(permanentPreview('slashDamage',10,10,false),/5 → 5/);
});
test('hero comparison uses implemented Satyr modifiers',()=>{
 const html=heroComparison('satyr');
 assert.match(html,/Attack cooldown ×: 1 → 0.82/);
 assert.match(html,/Move speed ×: 1.05 → 1.12/);
 assert.match(html,/Bonus slash DMG: 0 → 2/);
});
