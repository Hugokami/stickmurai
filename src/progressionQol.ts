import { globals } from './globals';
import { safeStorage } from './storage';
import './progressionQol.css';

const num = (n: number) => Number(n.toFixed(3)).toString();
// Pure projections: never invoke apply(), callbacks, audio or mutate live stats.
export function upgradePreview(key: string): string {
  const ja = globals.currentLang === 'ja';
  const s = globals.playerStats as unknown as Record<string, number>;
  const rows: string[] = [];
  const change = (label: string, before: number, after: number, cap?: number, suffix = '') => {
    rows.push(`${label}: ${num(before)}${suffix} → ${num(after)}${suffix}${cap === undefined ? ` (${ja ? '上限なし' : 'no upgrade cap'})` : ` (${ja ? '限界' : 'cap'} ${num(cap)}${suffix})`}`);
  };
  const stat = (label: string, field: string, transform: (n: number) => number, cap?: number, suffix = '') => change(label, s[field] || 0, transform(s[field] || 0), cap, suffix);
  const rules: Record<string, () => void> = {
    puGiantName: () => stat('Slash size ×', 'slashSizeMult', n => Math.min(2.2,n+.125),2.2),
    puWindName: () => stat('Attack cooldown', 'attackCooldownBase', n => Math.max(.18,n*.92),.18,'s'),
    puFeatherName: () => stat('Dash cooldown', 'dashCooldownBase', n => Math.max(.72,n*.90),.72,'s'),
    puSwiftName: () => stat('Move speed ×', 'moveSpeedMult', n => Math.min(1.5,n+.1),1.5),
    puBloodName: () => stat('Flow gain ×','flowGenMult',n=>n+.15),
    puDeadeyeName: () => change('Critical chance', (s.critChanceBonus || 0) * 100, Math.min(0.4, (s.critChanceBonus || 0) + 0.1) * 100, 40, '%'),
    puLethalName: () => stat('Skill bonus damage','enhanceBonusDmg',n=>n+1),
    puColossalName: () => stat('Skill size ×','enhanceSizeMult',n=>n+.5),
    puDurationName: () => stat('Skill duration','enhanceDuration',n=>n+1.5,undefined,'s'),
    puShieldDurationName: () => stat('Skill duration','enhanceDuration',n=>n+1.5,undefined,'s'),
    puChargeSpeedName: () => stat('Charge speed ×','iaijutsuChargeSpeed',n=>n+.35),
    puDeflectDmgName: () => stat('Deflect damage','deflectedDmg',n=>n+2),
    puVampireName: () => change('Vampire chance',s.vampireChance*100,(s.vampireChance+.06)*100,undefined,'%'),
    puDimensionalName: () => stat('Iaijutsu range ×','iaijutsuRangeMult',n=>n+.3),
    puStoutHeartName: () => change('Max hearts',globals.maxLives,Math.min(7,globals.maxLives+1),7),
    puZenRestoreName: () => change('Hearts',globals.lives,Math.min(3,globals.lives+1),3),
    puPetalArmorName: () => change('Armor level',globals.petalArmorLevel,globals.petalArmorLevel+1),
    puEchoSlashName: () => change('Echo level',globals.echoLevel,globals.echoLevel+1),
    puTempoMasteryName: () => change('Tempo level',globals.tempoMasteryLevel,globals.tempoMasteryLevel+1),
    puCursedGlassName: () => { change('Max hearts',globals.maxLives,Math.max(1,globals.maxLives-3)); stat('Skill bonus damage','enhanceBonusDmg',n=>n+3); stat('Slash size ×','slashSizeMult',n=>Math.min(2.2,n+.25),2.2); stat('Dash cooldown','dashCooldownBase',n=>Math.max(.72,n*.85),.72,'s'); },
    puCursedBloodName: () => { stat('Flow gain ×','flowGenMult',n=>n+.5); change('Vampire chance',s.vampireChance*100,(s.vampireChance+.15)*100,undefined,'%'); },
    puCursedIronName: () => { stat('Dash cooldown','dashCooldownBase',n=>n*1.25,undefined,'s'); stat('Slash size ×','slashSizeMult',n=>Math.min(2.2,n+.5),2.2); stat('Deflect damage','deflectedDmg',n=>n+6); },
    puGaleVortexName: () => stat('Skill duration','enhanceDuration',n=>Math.max(1,n-1),1,'s'),
  };
  const levels: Record<string,string> = { ShieldPulse:'shieldPulseLevel', ShieldBlast:'shieldBlastLevel', DashDamage:'dashDamageLevel', DashRange:'dashRangeLevel', DashThunder:'dashThunderLevel', FirewheelRange:'firewheelRangeLevel', FirewheelBlaze:'firewheelBlazeLevel', FirewheelEcho:'firewheelEchoLevel', GravityRadius:'gravityRadiusLevel', GravityDamage:'gravityDamageLevel', GravityExplosion:'gravityExplosionLevel', Fire:'fireStanceLevel', Clones:'shadowClonesLevel', Execution:'executionLevel' };
  const field = levels[key.replace(/^pu|Name$/g,'')];
  if (rules[key]) rules[key]();
  else if (field) stat(ja ? '強化レベル' : 'Upgrade level',field,n=>n+1);
  else rows.push(ja ? '新しい能力を解放（1回）' : 'Unlock ability (one time)');
  const count = globals.chosenPowerUps.filter(k=>k===key).length;
  return `<div class="qol-upgrade-details"><strong>${ja ? 'このステージのみ' : 'THIS STAGE ONLY'}</strong><span>${ja ? '取得数' : 'Acquired'}: ${count}</span>${rows.map(r=>`<span>${r}</span>`).join('')}</div>`;
}

export function renderStageBriefing(stage: number, anchor: HTMLElement) {
  let el = document.getElementById('qol-stage-briefing');
  if (!el) { el = document.createElement('div'); el.id='qol-stage-briefing'; el.className='qol-briefing'; anchor.after(el); }
  const ja=globals.currentLang==='ja';
  const targets: Record<number,number>={1:25,2:35,3:45,4:55,6:40,7:50,8:60,9:70};
  const boss=stage%5===0;
  const first=!(globals.clearedStages||[]).includes(stage);
  const fortune=1+((globals.campaignUpgrades as any)?.infiniteFortune||0)*.02;
  const reward=Math.round(stage*100*fortune)*(first?3:1);
  const objective=boss ? (ja?'ボスを倒す':'Defeat the boss') : `${ja?'撃破目標':'Eliminate'}: ${targets[stage]||Math.min(90,35+stage*4)}`;
  el.textContent=`${objective} · ${ja?'報酬':'Clear reward'}: ${reward.toLocaleString()} 🔮${first?' (×3 first clear)':''} · ★ ${boss?90:60}s · ★ 20 combo · +300 🔮 ${ja?'初の三つ星':'first 3-star clear'}`;
  try { const best=JSON.parse(safeStorage.getItem('stickmurai_stage_bests')||'{}')[stage]; if(best && [best.time,best.damage,best.combo].every(Number.isFinite)) { const p=document.createElement('div'); p.textContent=`${ja?'自己ベスト':'Personal best'}: ${num(best.time)}s · ${best.damage} ${ja?'被ダメージ':'damage taken'} · ${best.combo} combo`; el.append(p); } } catch { /* Invalid optional records never block stage selection. */ }
}

// Baseline archetype modifiers, verified against initGame in main.ts.
const heroStats: Record<string,number[]>={default:[0,1.05,1,1,1,0],luneblade:[2,1,1,1,1.35,0],ninja:[0,1.3,.85,.75,1,0.2],samurai:[1,1.15,.65,1,1,0],nightborne:[3,1.1,1,1,1.4,0],satyr:[2,1.12,.82,1,1.25,0],akakage:[5,1.2,.72,.82,1.35,0.25]};
export function heroComparison(id:string):string {
 const a=heroStats[id]||heroStats.default,b=heroStats[globals.selectedHero]||heroStats.default;
 const labels=['Bonus slash DMG','Move speed ×','Attack cooldown ×','Dash cooldown ×','Slash size ×','Crit chance'];
 return `<div class="qol-upgrade-details"><strong>${globals.currentLang==='ja'?'装備中 → この英雄':'Equipped → this hero'}</strong>${a.map((n,i)=>`<span>${labels[i]}: ${i===5 ? `${num(b[i]*100)}% → ${num(n*100)}%` : `${num(b[i])} → ${num(n)}`}</span>`).join('')}</div>`;
}

export function permanentPreview(id: string, level: number, max: number, endless: boolean): string {
 const next=endless?level+1:Math.min(max,level+1);
 const effects:Record<string,[string,number,string]>={slashDamage:['Bonus slash damage',.5,''],iaijutsuPower:['Bonus Iaijutsu damage',1,''],maxLives:['Extra hearts',1,''],dashCooldown:['Dash cooldown reduction',.08,'s'],spiritResonance:['Bonus flow gain',15,'%'],infiniteSharpness:['Bonus slash damage',.25,''],infiniteFlow:['Bonus flow gain',1,'%'],infiniteFortune:['Bonus Magatama',2,'%'],infiniteRiposte:['Bonus posture damage',1,'']};
 const effect=effects[id];
 if(!effect)return '';
 return `<div>${effect[0]}: ${num(level*effect[1])}${effect[2]} → ${num(next*effect[1])}${effect[2]}${id==='dashCooldown'?' (cooldown floor 0.4s)':''}${id==='iaijutsuPower'?` · Range: +${level*8}% → +${next*8}%`:''}</div>`;
}
