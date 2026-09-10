// Shared by combat and Dojo: percentages are fractions, cooldowns are multipliers.
export interface HeroBalance {
  cost:number; slash:number; move:number; attack:number; dash:number; area:number;
  crit:number; iai:number; posture:number; skillCooldown:number;
  passiveEn:string; passiveJa:string;
}
export const HERO_BALANCE:Record<string,HeroBalance> = {
  default:{cost:0,slash:0,move:1.05,attack:1,dash:1,area:1,crit:.05,iai:0,posture:12,skillCooldown:1,passiveEn:'Parry Prodigy: +35% parry window and +12 posture damage.',passiveJa:'弾きの達人：パリィ猶予+35%、体幹ダメージ+12。'},
  luneblade:{cost:50000,slash:.20,move:1.08,attack:.95,dash:1,area:1.35,crit:.10,iai:3,posture:0,skillCooldown:1,passiveEn:'Lunar Resonance: +35% slash reach and +3 Iaijutsu damage.',passiveJa:'月華共鳴：斬撃範囲+35%、抜刀ダメージ+3。'},
  ninja:{cost:60000,slash:.15,move:1.30,attack:.85,dash:.75,area:1,crit:.12,iai:1,posture:0,skillCooldown:.98,passiveEn:'Phantom Strike: +30% movement, -25% dash cooldown and phantom dash afterimages.',passiveJa:'幻影瞬歩：移動+30%、瞬歩クールダウン-25%、影の残像。'},
  samurai:{cost:75000,slash:.30,move:1.15,attack:.70,dash:1,area:1.10,crit:.15,iai:2,posture:0,skillCooldown:.96,passiveEn:'Kensei: every third basic slash cleaves up to 5 nearby foes for 50% slash damage.',passiveJa:'剣聖：通常斬撃3回ごとに周囲最大5体へ斬撃の50%ダメージ。'},
  nightborne:{cost:100000,slash:.40,move:1.12,attack:.76,dash:1,area:1.40,crit:.18,iai:5,posture:0,skillCooldown:.94,passiveEn:'Soul Siphon: executions restore 1 heart and grant 35 Magatama.',passiveJa:'魂の吸収：処刑で体力1回復、勾玉35獲得。'},
  satyr:{cost:150000,slash:.50,move:1.18,attack:.80,dash:.95,area:1.30,crit:.21,iai:6,posture:8,skillCooldown:.92,passiveEn:'Earthshaker: executions deal 18 damage and 32 posture to up to 4 nearby foes; 5s cooldown.',passiveJa:'大地震：処刑で周囲最大4体に18ダメージ・体幹32。再使用5秒。'},
  akakage:{cost:350000,slash:.65,move:1.25,attack:.72,dash:.82,area:1.35,crit:.25,iai:4,posture:0,skillCooldown:.90,passiveEn:'Crimson Aftermath: one echo after each basic slash, dealing 45% slash damage (maximum 12).',passiveJa:'紅蓮残影：通常斬撃後に一度追撃。斬撃の45%ダメージ（上限12）。'}
};
export const heroBalance=(id:string):HeroBalance=>HERO_BALANCE[id]||HERO_BALANCE.default;
export const BOSS_BASE_HP = {oni_boss:150,agis_colossus:255,skeleton_warlord:225,shogun_boss:195};
export function campaignHpMultiplier(stage:number,boss:boolean):number {
  return 1.5*(1+(Math.max(1,stage)-1)*(boss?.11:.16));
}
export function heroDescription(id:string,ja=false):string {
  const b=heroBalance(id),pct=(v:number)=>Math.round(v*100);
  return ja?`斬撃ダメージ+${pct(b.slash)}%・会心率${pct(b.crit)}%・スキル再使用時間-${pct(1-b.skillCooldown)}%。${b.passiveJa}`:`+${pct(b.slash)}% slash damage · ${pct(b.crit)}% base crit · ${pct(1-b.skillCooldown)}% active-skill cooldown reduction. ${b.passiveEn}`;
}
