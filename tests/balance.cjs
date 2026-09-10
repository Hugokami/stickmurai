const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const code=stripTypeScriptTypes(fs.readFileSync('src/balance.ts','utf8')).replace(/export /g,'');
const {HERO_BALANCE,BOSS_BASE_HP,campaignHpMultiplier,heroBalance,heroDescription}=new Function(code+';return {HERO_BALANCE,BOSS_BASE_HP,campaignHpMultiplier,heroBalance,heroDescription};')();
test('boss bases fall by 25% and scaling growth is exactly halved',()=>{
 const oldBases={oni_boss:200,agis_colossus:340,skeleton_warlord:300,shogun_boss:260};
 for(const [id,hp] of Object.entries(oldBases))assert.equal(BOSS_BASE_HP[id],hp*.75);
 for(const stage of [1,5,10,15,20,50,100]){
  assert.ok(Math.abs((campaignHpMultiplier(stage,true)/1.5-1)-((stage-1)*.22/2))<1e-10);
  assert.equal(campaignHpMultiplier(stage,false),1.5*(1+(stage-1)*.16));
 }
 assert.equal(Math.round(BOSS_BASE_HP.oni_boss*campaignHpMultiplier(5,true)),324);
 assert.equal(Math.round(BOSS_BASE_HP.agis_colossus*campaignHpMultiplier(10,true)),761);
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
