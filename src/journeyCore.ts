export const HERO_IDS = ['default','luneblade','ninja','samurai','nightborne','satyr','akakage'] as const;
export const SKILL_IDS = ['enhance','shield','dash','firewheel','gravity','parry_master','decoy_illusion'] as const;
export type Contract = 'untouched' | 'swift' | 'sword';
export interface HeroRecord { clears:number; kills:number; bosses:number; parries:number; dodges:number; combo:number; flawless:number }
export interface JourneySave {
  version:1; heroes:Record<string,HeroRecord>; contracts:string[];
  presets:Array<{hero:string;skill:string}>; rush:{wins:number;bestTime:number}; accent:string;
}
export const emptyHero = ():HeroRecord => ({clears:0,kills:0,bosses:0,parries:0,dodges:0,combo:0,flawless:0});
export const emptyJourney = ():JourneySave => ({version:1,heroes:{},contracts:[],presets:[],rush:{wins:0,bestTime:0},accent:'gold'});
const count = (value:unknown) => typeof value==='number' && Number.isFinite(value) ? Math.min(1e9,Math.max(0,value)) : 0;
export function parseJourney(raw:string|null):JourneySave {
  const out=emptyJourney();
  try {
    const value=JSON.parse(raw||'null'); if(!value||value.version!==1)return out;
    for(const hero of HERO_IDS) {
      if(!value.heroes?.[hero])continue;
      const record=emptyHero();
      for(const key of Object.keys(record) as Array<keyof HeroRecord>)record[key]=Math.floor(count(value.heroes[hero][key]));
      out.heroes[hero]=record;
    }
    if(Array.isArray(value.contracts))out.contracts=[...new Set<string>(value.contracts.filter((x:unknown)=>typeof x==='string'&&/^[1-9]\d{0,5}:(untouched|swift|sword)$/.test(x)))].slice(0,10000);
    if(Array.isArray(value.presets))out.presets=value.presets.filter((p:any)=>p&&HERO_IDS.includes(p.hero)&&SKILL_IDS.includes(p.skill)).slice(0,3).map((p:any)=>({hero:p.hero,skill:p.skill}));
    out.rush={wins:Math.floor(count(value.rush?.wins)),bestTime:count(value.rush?.bestTime)};
    if(['gold','cyan','violet'].includes(value.accent))out.accent=value.accent;
  } catch { /* Corrupt optional records cannot block startup. */ }
  return out;
}
export interface ClearResult { kills:number;bosses:number;parries:number;dodges:number;combo:number;damage:number;seconds:number;skillUses:number;stage:number }
export function addClear(previous:HeroRecord,result:ClearResult):HeroRecord {
  return {clears:previous.clears+1,kills:previous.kills+result.kills,bosses:previous.bosses+result.bosses,parries:previous.parries+result.parries,dodges:previous.dodges+result.dodges,combo:Math.max(previous.combo,result.combo),flawless:previous.flawless+(result.damage===0?1:0)};
}
export function contractPassed(contract:Contract,result:ClearResult):boolean {
  if(contract==='untouched')return result.damage===0;
  if(contract==='swift')return result.seconds<=(result.stage%5===0?90:60);
  return result.skillUses===0;
}
export function signatureProgress(hero:string,record:HeroRecord):{label:string;value:number;target:number} {
  const goals:Record<string,[string,keyof HeroRecord,number]>={default:['Parries','parries',25],ninja:['Perfect dodges','dodges',25],luneblade:['Best combo','combo',50],samurai:['Stage clears','clears',10],nightborne:['Boss kills','bosses',5],satyr:['No-hit clears','flawless',3],akakage:['Kills in cleared stages','kills',500]};
  const [label,key,target]=goals[hero]||goals.default;return {label,value:record[key],target};
}
export function masteryRank(hero:string,record:HeroRecord):number {
  if(record.clears<3)return 0;
  const goal=signatureProgress(hero,record);if(goal.value<goal.target)return 1;
  return record.bosses>=10&&record.flawless>=3?3:2;
}
export function encounterBudget(stage:number,seconds:number,mobile:boolean,bossAlive:boolean):{cap:number;batch:number;delay:number;label:string} {
  if(bossAlive)return {cap:mobile?5:7,batch:1,delay:2400,label:'Boss duel'};
  const phase=Math.floor(seconds/12)%3;
  const cap=Math.min(mobile?22:30,(mobile?12:16)+Math.floor(stage/2));
  return phase===2 ? {cap,batch:1,delay:1800,label:'Regroup'} : {cap,batch:Math.min(3,1+Math.floor(stage/5)),delay:phase===0?1000:750,label:phase===0?'Skirmish':'Pressure'};
}
export function hazardContains(x:number,y:number,h:{x:number;y:number;radius:number;inner:number}):boolean {
  const d=(x-h.x)**2+(y-h.y)**2; return d<=h.radius*h.radius&&d>=h.inner*h.inner;
}
