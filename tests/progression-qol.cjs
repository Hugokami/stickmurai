const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const balanceSource = stripTypeScriptTypes(fs.readFileSync('src/balance.ts','utf8')).replace(/export /g,'');
const {heroBalance}=new Function(balanceSource+';return {heroBalance};')();
const globals = { currentLang:'en', selectedHero:'default', chosenPowerUps:['puFeatherName'], playerStats:{dashCooldownBase:1.2, slashSizeMult:2.15, attackCooldownBase:.19, vampireChance:.06}, maxLives:5, lives:3, petalArmorLevel:0, echoLevel:0, tempoMasteryLevel:0 };
const output = stripTypeScriptTypes(fs.readFileSync('src/progressionQol.ts','utf8')).replace(/^import .*;$/gm, '').replace(/export function /g, 'function ') + '\nmodule.exports = { upgradePreview, permanentPreview, heroComparison };';
const mod={exports:{}};
new Function('globals','safeStorage','module','heroBalance',output)(globals,{getItem:()=>null},mod,heroBalance);
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
 assert.match(permanentPreview('slashDamage',10,10,false),/10% → 10%/);
});
test('hero comparison uses implemented Satyr modifiers',()=>{
 const html=heroComparison('satyr');
 assert.match(html,/Attack cooldown ×: 1 → 0.8/);
 assert.match(html,/Move speed ×: 1.05 → 1.18/);
 assert.match(html,/Bonus slash damage: 0% → 50%/);
 assert.match(html,/Base crit chance: 5% → 21%/);
 assert.match(html,/Skill cooldown ×: 1 → 0.92/);
});
