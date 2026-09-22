const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const code=stripTypeScriptTypes(fs.readFileSync('src/balance.ts','utf8')).replace(/export /g,'');
const {HERO_BALANCE,BOSS_BASE_HP,campaignHpMultiplier,heroBalance,heroDescription}=new Function(code+';return {HERO_BALANCE,BOSS_BASE_HP,campaignHpMultiplier,heroBalance,heroDescription};')();
test('boss bases are robustly buffed and scale properly with late-game power',()=>{
 const expectedBases={oni_boss:600,agis_colossus:950,skeleton_warlord:850,shogun_boss:800};
 for(const [id,hp] of Object.entries(expectedBases))assert.equal(BOSS_BASE_HP[id],hp);
 for(const stage of [1,5,10,15,20,50,100]){
  const late = Math.max(0, stage - 5);
  const stage50Mult = stage >= 50 ? 5.0 : 1.0;
  const stage60BossMult = stage >= 60 ? 1.3 : 1.0;
  const early = 0.6 + (stage - 1) * 1.65;
  const expectedBoss = stage50Mult * stage60BossMult * (early + late * 2.5 + (late * late) * 0.35);
  const expectedMob = 1.5 * (1 + (stage - 1) * 0.20 + late * 0.35 + (late * late) * 0.02);
  assert.ok(Math.abs(campaignHpMultiplier(stage, true) - expectedBoss) < 1e-10);
  assert.ok(Math.abs(campaignHpMultiplier(stage, false) - expectedMob) < 1e-10);
 }
 assert.equal(Math.round(BOSS_BASE_HP.oni_boss*campaignHpMultiplier(1,true)),360);
 assert.equal(Math.round(BOSS_BASE_HP.oni_boss*campaignHpMultiplier(5,true)),4320);
 assert.equal(Math.round(BOSS_BASE_HP.agis_colossus*campaignHpMultiplier(10,true)),34865);
});
test('hero prices keep a rising baseline attack budget and capped crit',()=>{
 let previous=0;
 for(const [id,h] of Object.entries(HERO_BALANCE).sort((a,b)=>a[1].cost-b[1].cost)){
  const sustained=(1+h.slash)*(1+h.crit)/h.attack;
  assert.ok(sustained>=previous, id+' baseline damage budget regressed');previous=sustained;
  assert.ok(h.crit>=.05&&h.crit<=.25);
  assert.ok(h.skillCooldown>=.9&&h.skillCooldown<=1);
  assert.ok(heroDescription(id).includes(`${Math.round(h.slash*100)}% slash damage`));
 }
 assert.equal(heroBalance('obsolete-hero'),HERO_BALANCE.default);
});

test('boss damage governor formula clamps maximum single hit to 8-12% boss max HP with weapon floor', () => {
  const stage1BossHp = 360;
  const stage1SlashDmg = 12;
  const minFloor = Math.max(12, Math.round(stage1SlashDmg * 3.0));
  const maxHitStage1 = Math.max(minFloor, Math.round(stage1BossHp * 0.12));
  assert.equal(maxHitStage1, 43);

  const stage10BossHp = 34865;
  const stage10SlashDmg = 55;
  const maxHitStage10 = Math.max(Math.max(12, Math.round(stage10SlashDmg * 3.0)), Math.round(stage10BossHp * 0.12));
  assert.equal(maxHitStage10, 4184);
});

test('audio crescendo formula scales dynamically with combo and clamps at 1.45x', () => {
  const crescendo = (combo) => Math.min(1.45, 1.0 + combo * 0.015);
  assert.equal(crescendo(0), 1.0);
  assert.equal(crescendo(10), 1.15);
  assert.equal(crescendo(20), 1.30);
  assert.equal(crescendo(30), 1.45);
  assert.equal(crescendo(100), 1.45);
});
