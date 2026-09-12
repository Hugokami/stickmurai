import { globals } from './globals';
import { safeStorage } from './storage';
import { callbacks } from './callbacks';
import { bindQolButton, clearGameInputs, showToast } from './qol';
import { isPractice } from './runtimeQol';
import { addClear, contractPassed, emptyHero, masteryRank, parseJourney, signatureProgress, type Contract } from './journeyCore';
import './journey.css';
import { resolveAssetUrl } from './assets';
import { bossStatus } from './combatPolish';

const KEY='stickmurai_journey';
let data=parseJourney(safeStorage.getItem(KEY));
let startRun:()=>void=()=>{};
let heroList:Array<{id:string;nameEn:string;image:string}>=[];
let panel:HTMLElement;
let body:HTMLElement;
let detail:HTMLElement;
let runDamage=0, skillUses=0, runFinished=false;
let selectedContract: {stage:number;id:Contract}|null=null;
let runContract:{stage:number;id:Contract}|null=null;
let rush: {index:number;seconds:number;previousStage:number;previousTimer:typeof globals.timerLimit;previousMode:typeof globals.gameMode}|null=null;
const rushStages=[5,10,15,20];
const contractNames:Record<Contract,string>={untouched:'Untouched · take no damage',swift:'Swift blade · clear within par time',sword:'Sword discipline · no active skill'};
const text=(en:string,ja:string)=>globals.currentLang==='ja'?ja:en;
function persist(){safeStorage.setItem(KEY,JSON.stringify(data));}
function btn(label:string,fn:()=>void){const b=document.createElement('button');b.type='button';b.className='qol-btn';b.textContent=label;bindQolButton(b,fn);return b;}
function line(parent:HTMLElement,value:string){const p=document.createElement('p');p.textContent=value;parent.append(p);return p;}
function card(title:string){const el=document.createElement('article');el.className='journey-card';const h=document.createElement('h3');h.textContent=title;el.append(h);body.append(el);return el;}
function open(){ if(globals.gameState!=='mainmenu')return;render();panel.hidden=false;panel.querySelector<HTMLButtonElement>('button')?.focus(); }
function close(){if(rush&&runFinished){finishRush();return;}panel.hidden=true;document.getElementById('journey-open')?.focus();}
function saveSelection(hero:string,skill:string){
  if(!globals.unlockedHeroes.includes(hero)||!globals.unlockedSkills.includes(skill)){showToast('Unlock this hero and skill first.');return;}
  globals.selectedHero=hero;globals.selectedSkill=skill as typeof globals.selectedSkill;
  safeStorage.setItem('stickmurai_selected_hero',hero);safeStorage.setItem('stickmurai_selected_skill',skill);callbacks.updateEnhanceButton();
  showToast('Loadout equipped.');render();
}
function render(){
  body.replaceChildren();
  const presets=card(text('Loadout presets','装備セット'));
  line(presets,'Save up to three hero + active-skill combinations. Powerups are earned again each stage.');
  data.presets.forEach((p,i)=>{const row=document.createElement('div');row.className='journey-actions';row.append(btn(`Equip ${i+1}: ${p.hero} / ${p.skill}`,()=>saveSelection(p.hero,p.skill)),btn('Remove',()=>{data.presets.splice(i,1);persist();render();}));presets.append(row);});
  const add=btn(`Save ${globals.selectedHero} / ${globals.selectedSkill}`,()=>{if(data.presets.length>=3)return;data.presets.push({hero:globals.selectedHero,skill:globals.selectedSkill});persist();render();});add.disabled=data.presets.length>=3;presets.append(add);

  const contracts=card(text('Challenge contracts','挑戦契約'));
  line(contracts,'Replay a cleared stage. Each contract pays +300 Magatama once per stage; repeat for practice. Failed contracts still allow a normal clear.');
  const stage=document.createElement('select');stage.setAttribute('aria-label','Contract stage');
  const stages=[...new Set(globals.clearedStages)].sort((a,b)=>b-a).slice(0,100);
  for(const n of stages){const o=document.createElement('option');o.value=String(n);o.textContent=`Stage ${n}`;stage.append(o);}contracts.append(stage);
  if(!stages.length)line(contracts,'Clear a campaign stage to unlock contracts.');
  const choices=document.createElement('div');choices.className='journey-actions';contracts.append(choices);
  const showContracts=()=>{choices.replaceChildren();for(const id of Object.keys(contractNames) as Contract[]){const n=Number(stage.value);const claimed=data.contracts.includes(`${n}:${id}`);const b=btn(`${claimed?'✓ ':''}${contractNames[id]}`,()=>{if(!globals.clearedStages.includes(n))return;selectedContract={stage:n,id};globals.currentStage=n;globals.gameMode='classic';globals.timerLimit='endless';close();document.querySelectorAll<HTMLElement>('.overlay').forEach(el=>{if(el.id!=='loader-screen')el.style.display='none';});startRun();});b.disabled=!stages.length;choices.append(b);}};stage.onchange=showContracts;showContracts();

  const rushCard=card('Boss Rush · four duels');
  line(rushCard,'Face stages 5, 10, 15 and 20 in order. Fresh hearts and powerups each duel. Campaign progress is unchanged; records track total combat time.');
  line(rushCard,`Victories: ${data.rush.wins} · Best: ${data.rush.bestTime?data.rush.bestTime.toFixed(1)+'s':'—'} · First full clear: +1,000 Magatama`);
  const rushStart=btn('Enter Boss Rush',()=>{if(!rushStages.every(n=>globals.clearedStages.includes(n)))return;rush={index:0,seconds:0,previousStage:globals.currentStage,previousTimer:globals.timerLimit,previousMode:globals.gameMode};selectedContract=null;globals.gameMode='classic';globals.timerLimit='endless';globals.currentStage=5;close();document.querySelectorAll<HTMLElement>('.overlay').forEach(el=>{if(el.id!=='loader-screen')el.style.display='none';});startRun();});
  rushStart.disabled=!rushStages.every(n=>globals.clearedStages.includes(n));rushCard.append(rushStart);if(rushStart.disabled)line(rushCard,'Unlock by clearing all four campaign boss stages.');

  const cosmetics=card('HUD accent');
  const total=Object.values(data.heroes).reduce((sum,h)=>sum+h.clears,0);
  for(const [name,needed] of [['gold',0],['cyan',3],['violet',10]] as const){const b=btn(`${name}${needed?` · ${needed} clears`:''}`,()=>{data.accent=name;persist();applyAccent();render();});b.disabled=total<needed;cosmetics.append(b);}
  for(const hero of heroList){
    const record=data.heroes[hero.id]||emptyHero(),rank=masteryRank(hero.id,record),goal=signatureProgress(hero.id,record);
    const el=card(hero.nameEn);const portrait=document.createElement('img');portrait.src=resolveAssetUrl(hero.image);portrait.alt=hero.nameEn;portrait.className='journey-portrait';el.prepend(portrait);
    line(el,`${['Unranked','Initiate','Adept','Legend'][rank]} ${'◆'.repeat(rank)}`);
    line(el,`Initiate: ${Math.min(3,record.clears)}/3 clears · Adept: ${goal.label} ${Math.min(goal.target,goal.value)}/${goal.target}`);
    line(el,`Legend: ${Math.min(10,record.bosses)}/10 bosses + ${Math.min(3,record.flawless)}/3 no-hit clears, after Adept`);
    line(el,'Titles and portrait badges are cosmetic. Feats count on completed stages only.');
  }
}
function applyAccent(){document.documentElement.style.setProperty('--journey-accent',({gold:'#ffd700',cyan:'#67e8f9',violet:'#c4b5fd'} as Record<string,string>)[data.accent]);}
export function initJourney(start:()=>void,heroes:typeof heroList){
  startRun=start;heroList=heroes;applyAccent();
  panel=document.createElement('section');panel.className='qol-panel';panel.id='journey-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Trials and mastery');
  const box=document.createElement('div');box.className='journey-box';panel.append(box);
  const header=document.createElement('header');const heading=document.createElement('h2');heading.textContent='Trials & Mastery';header.append(heading,btn('Close ✕',close));box.append(header);
  body=document.createElement('div');body.className='journey-grid';box.append(body);document.body.append(panel);
  const openBtn = document.getElementById('journey-open-btn');
  if (openBtn) {
    openBtn.id = 'journey-open';
    openBtn.addEventListener('click', open);
  }
  detail=document.createElement('div');detail.id='journey-objective';detail.hidden=true;document.getElementById('objective-display')?.after(detail);
}
export function beginJourneyRun(){runDamage=0;skillUses=0;runFinished=false;runContract=!isPractice()&&globals.gameMode==='classic'&&selectedContract?.stage===globals.currentStage?{...selectedContract}:null;}
export function journeyHurt(amount:number){if(!isPractice()&&globals.gameMode==='classic')runDamage+=Math.max(0,amount);}
export function journeySkill(){skillUses++;}
export const isBossRush=()=>rush!==null;
export function masteryBadge(hero:string){const rank=masteryRank(hero,data.heroes[hero]||emptyHero());return rank?`${'◆'.repeat(rank)} ${['','Initiate','Adept','Legend'][rank]}`:'';}
export function leaveJourney(){if(rush){globals.currentStage=rush.previousStage;globals.timerLimit=rush.previousTimer;globals.gameMode=rush.previousMode;rush=null;}selectedContract=null;runContract=null;}
export function completeJourneyStage():boolean {
  if(isPractice()||globals.gameMode!=='classic')return false;
  if(runFinished)return true;
  runFinished=true;
  const result={stage:globals.currentStage,seconds:globals.runTime,damage:runDamage,skillUses,kills:globals.runStats.kills,bosses:globals.runStats.bossesKilled,parries:globals.runStats.parries,dodges:globals.runStats.perfectDodges,combo:globals.runStats.maxCombo};
  const hero=globals.selectedHero,previous=data.heroes[hero]||emptyHero();data.heroes[hero]=addClear(previous,result);
  const rank=masteryRank(hero,data.heroes[hero]);if(rank>masteryRank(hero,previous))showToast(`${hero}: ${['','Initiate','Adept','Legend'][rank]} mastery unlocked!`);
  if(runContract){const key=`${result.stage}:${runContract.id}`;const passed=contractPassed(runContract.id,result);if(passed&&!data.contracts.includes(key)){data.contracts.push(key);globals.magatama+=300;safeStorage.setItem('stickmurai_magatama',String(globals.magatama));showToast('Contract completed · +300 Magatama');}else showToast(passed?'Contract completed again.':'Stage cleared · contract not fulfilled.');selectedContract=null;runContract=null;}
  persist();
  if(!rush)return false;
  rush.seconds+=globals.runTime;globals.gameState='stageclear';clearGameInputs();
  body.replaceChildren();const el=card(rush.index===3?'Boss Rush conquered!':`Duel ${rush.index+1}/4 complete`);line(el,`Total combat time: ${rush.seconds.toFixed(1)}s`);
  if(rush.index===3){if(!data.rush.wins){globals.magatama+=1000;safeStorage.setItem('stickmurai_magatama',String(globals.magatama));line(el,'First victory · +1,000 Magatama');}data.rush.wins++;data.rush.bestTime=data.rush.bestTime?Math.min(data.rush.bestTime,rush.seconds):rush.seconds;persist();}
  else el.append(btn('Next duel',()=>{if(!rush)return;rush.index++;globals.currentStage=rushStages[rush.index];panel.hidden=true;startRun();}));
  el.append(btn('Return to menu',finishRush));panel.hidden=false;
  // Header close is also a safe exit; closing never strands a completed duel.
  return true;
}
function finishRush(){leaveJourney();panel.hidden=true;callbacks.onQuitToMainMenu();document.getElementById('main-menu')!.style.display='flex';document.getElementById('ui-layer')!.style.display='none';document.getElementById('mobile-controls')!.style.display='none';}
let hudTime=0;
export function updateJourneyHud(dt:number){
  if(!detail)return;
  if(rush&&runFinished&&panel.hidden){finishRush();return;}
  hudTime+=dt;if(hudTime<.1)return;hudTime=0;
  const visible=globals.gameState==='playing'&&globals.gameMode==='classic'&&!isPractice();if(detail.hidden===visible)detail.hidden=!visible;if(!visible)return;
  const record=data.heroes[globals.selectedHero]||emptyHero(),rank=masteryRank(globals.selectedHero,record);
  const fortune=globals.playerStats.fortuneMult||1,first=!globals.clearedStages.includes(globals.currentStage);
  let message=rush?`BOSS RUSH ${rush.index+1}/4`:`Clear reward ${Math.round(globals.currentStage*100*fortune)*(first?3:1)} ◇`;
  if(runContract)message+=` · ${contractNames[runContract.id]}${(runContract.id==='untouched'&&runDamage>0)||(runContract.id==='sword'&&skillUses>0)?' (missed)':''}`;
  if(rank)message+=` · ${['','Initiate','Adept','Legend'][rank]} ${'◆'.repeat(rank)}`;
  const boss=bossStatus();if(boss)message+=` · ${boss}`;
  if(detail.textContent!==message)detail.textContent=message;
}
