import { globals } from './globals';
import { setPracticeStorage } from './storage';
import { bindQolButton, showToast } from './qol';

let practice = false;
let returnToMenu: (() => void) | null = null;
let threatTimer = 0;
let threatRoot: HTMLElement | null = null;
let hurtCount = 0;
export const isPractice = () => practice;
export function initRuntimeQol(onReturn: () => void) {
  returnToMenu = onReturn;
  window.addEventListener('qol-practice', e => {
    const hero = String((e as CustomEvent).detail || 'default');
    practice = true; setPracticeStorage(true); globals.selectedHero = hero; globals.gameMode = 'classic';
    document.querySelectorAll<HTMLElement>('.overlay').forEach(el => { if (el.id !== 'loader-screen') el.style.display='none'; });
    const bar=document.createElement('div');bar.id='qol-practice-bar';bar.innerHTML=`<span>TRAINING · ${hero.toUpperCase()}</span>`;
    const exit=document.createElement('button');exit.className='qol-btn';exit.textContent='Exit';bindQolButton(exit,exitPractice);bar.append(exit);document.body.append(bar);
    const dummy=document.createElement('div');dummy.id='qol-practice-dummy';dummy.textContent='TRAINING DUMMY';dummy.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);color:#d8bf8b;font:700 18px Outfit,system-ui,sans-serif;pointer-events:none;z-index:18';document.body.append(dummy);
    globals.gameState='playing'; if (returnToMenu) returnToMenu();
  });
  window.addEventListener('qol-clear-inputs', clearThreats);
}
function exitPractice() {practice=false;setPracticeStorage(false);document.getElementById('qol-practice-bar')?.remove();document.getElementById('qol-practice-dummy')?.remove();clearThreats();globals.gameState='mainmenu';if(returnToMenu)returnToMenu();showToast('Training ended. No rewards or progress were saved.');}
export function practiceStep() {if(!practice)return; if(globals.enemies.length>0) globals.enemies.length=0;}
export function resetRunFeedback() {hurtCount=0;threatTimer=0;clearThreats();}
export function recordHurt(source:string, damage:number) {if(practice)return;hurtCount+=damage;showThreat(source);}
function showThreat(source:string) {
  try {
    if(!threatRoot){
      threatRoot=document.createElement('div');
      threatRoot.id='qol-threats';
      document.body.append(threatRoot);
    }
    const cleanSource = String(source || 'enemy').replace(/_/g, ' ');
    const e=document.createElement('div');
    e.className='qol-threat';
    e.textContent=`⚠ ${cleanSource} attack`;
    threatRoot.append(e);
    window.setTimeout(()=>{ try { e.remove(); } catch(err) {} }, 1100);
  } catch(err) {
    console.error('showThreat error:', err);
  }
}
export function updateThreats(dt:number) {
  try {
    if(!threatRoot) return;
    threatTimer-=dt;
    if(threatTimer<=0){
      threatTimer=0.5;
      while(threatRoot.children.length>2) threatRoot.firstElementChild?.remove();
    }
  } catch(err) {
    console.error('updateThreats error:', err);
  }
}
export function clearThreats(){
  try {
    threatRoot?.remove();
    threatRoot=null;
  } catch(err) {
    console.error('clearThreats error:', err);
  }
}
export function showDefeatFeedback(timeLimit=false){const el=document.getElementById('stats-summary');if(!el)return;const old=el.innerHTML;el.insertAdjacentHTML('afterbegin',`<div class="qol-note">${timeLimit?'Objective timer expired.':'Run ended.'} Damage taken: ${hurtCount}. Review telegraphs and try the same loadout again.</div>`);setTimeout(()=>{if(el.isConnected)el.innerHTML=old;},9000);}
