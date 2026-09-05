import { globals } from './globals';
import { safeStorage } from './storage';
import { ActionBuffer, clamp, SAVE_KEYS, validateSave, type SaveFile } from './qolCore';
import './qol.css';

export const actionBuffer = new ActionBuffer();
type Position = {x:number;y:number};
interface Preferences { size:string; handed:string; controlSize:number; opacity:number; sensitivity:number; buffer:number; sfx:number; music:number; positions:Record<string,Position> }
const defaults: Preferences = {size:'default',handed:'right',controlSize:72,opacity:.85,sensitivity:1,buffer:100,sfx:.5,music:.5,positions:{}};
export let qolSettings: Preferences = {...defaults,positions:{}};
try {
  const p = JSON.parse(safeStorage.getItem('stickmurai_qol') || '{}');
  for (const k of ['controlSize','opacity','sensitivity','buffer','sfx','music'] as const) if(typeof p[k] === 'number' && Number.isFinite(p[k])) qolSettings[k]=p[k];
  qolSettings.controlSize=clamp(qolSettings.controlSize,48,100); qolSettings.opacity=clamp(qolSettings.opacity,.3,1); qolSettings.sensitivity=clamp(qolSettings.sensitivity,.5,1.5); qolSettings.buffer=clamp(qolSettings.buffer,0,120); qolSettings.sfx=clamp(qolSettings.sfx,0,1); qolSettings.music=clamp(qolSettings.music,0,1);
  if(['small','default','large'].includes(p.size)) qolSettings.size=p.size;
  if(p.handed==='left') qolSettings.handed='left';
  for(const id of ['btn-attack','btn-dash','btn-enhance','btn-ult']) if(p.positions?.[id] && Number.isFinite(p.positions[id].x) && Number.isFinite(p.positions[id].y)) qolSettings.positions[id]={x:clamp(p.positions[id].x,.05,.95),y:clamp(p.positions[id].y,.1,.9)};
} catch { /* Defaults survive malformed preferences. */ }
const text = (en:string,ja:string) => globals.currentLang==='ja'?ja:en;
export function bindQolButton(el: HTMLElement, fn:()=>void) {
  let last=-1000;
  const run=(e:Event)=>{e.preventDefault();e.stopPropagation();const now=performance.now();if(now-last<350)return;last=now;fn();};
  el.addEventListener('pointerdown',run); el.addEventListener('click',run);
}
function button(label:string,fn:()=>void) {const b=document.createElement('button');b.className='qol-btn';b.type='button';b.textContent=label;bindQolButton(b,fn);return b;}
let toastTimer=0;
export function showToast(message:string) {const el=document.getElementById('qol-toast');if(!el)return;el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el.hidden=true,3500);}
export function clearGameInputs() {
  globals.keys={}; globals.mouse.down=false;globals.mouse.justPressed=false;globals.mouse.justReleased=false;
  globals.joystickActive=false;globals.joystickVector={x:0,y:0};
  for(const key of Object.keys(globals)) if((key.startsWith('mobile')||key.startsWith('useMobile'))&&typeof (globals as any)[key]==='boolean') (globals as any)[key]=false;
  actionBuffer.clear(); window.dispatchEvent(new Event('qol-clear-inputs'));
}
let resumeToken=0;
function visible(el:HTMLElement|null):el is HTMLElement{return !!el&&!el.hidden&&getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().width>0;}
export function cancelResume(){resumeToken++;const el=document.getElementById('qol-resume');if(el)el.hidden=true;}
export function requestResume() {
  if(globals.gameState!=='paused'||document.hidden)return;
  if(globals.gameMode==='pvp'){globals.gameState='playing';document.getElementById('pause-screen')!.style.display='none';return;}
  const token=++resumeToken;clearGameInputs();const panel=document.getElementById('qol-resume')!;panel.hidden=false;
  let count=3;const label=document.getElementById('qol-count')!;label.textContent=String(count);
  const tick=()=>{if(token!==resumeToken||document.hidden||globals.gameState!=='paused')return;if(--count===0){panel.hidden=true;clearGameInputs();document.getElementById('pause-screen')!.style.display='none';globals.gameState='playing';}else{label.textContent=String(count);window.setTimeout(tick,600);}};
  window.setTimeout(tick,600);
}
export function handleBack(e?:Event):boolean {
  const panels=[...document.querySelectorAll<HTMLElement>('.qol-panel')].reverse();
  for(const p of panels) if(visible(p)){e?.preventDefault();e?.stopPropagation();if(p.id==='qol-resume')cancelResume();else p.hidden=true;return true;}
  const closes:Record<string,string>={'settings-screen':'close-settings-btn','guide-modal':'close-guide-btn','grimoire-screen':'close-grimoire-btn','dojo-screen':'close-dojo-btn','skill-select-screen':'skill-back-btn','stage-clear-modal':'close-stage-clear-x-btn','game-over':'game-over-quit-btn','redeem-modal':'close-redeem-btn'};
  const candidates=Object.entries(closes).filter(([id])=>visible(document.getElementById(id))).sort((a,b)=>Number(getComputedStyle(document.getElementById(b[0])!).zIndex||0)-Number(getComputedStyle(document.getElementById(a[0])!).zIndex||0));
  for(const [,id] of candidates){const b=document.getElementById(id);if(b){e?.preventDefault();e?.stopPropagation();b.click();return true;}}
  return false;
}
function panel(id:string,title:string) {const p=document.createElement('section');p.id=id;p.className='qol-panel';p.hidden=true;p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label',title);const box=document.createElement('div');box.className='qol-box';const h=document.createElement('h2');h.textContent=title;box.append(h);p.append(box);document.body.append(p);return {p,box};}
function applySettings() {
  document.documentElement.dataset.qolSize=qolSettings.size;
  document.documentElement.classList.toggle('qol-left',qolSettings.handed==='left');
  document.documentElement.classList.add('qol-touch-custom');
  const ids=['btn-attack','btn-dash','btn-enhance','btn-ult'];
  ids.forEach((id,i)=>{const b=document.getElementById(id);if(!b)return;const p=controlPosition(id,i);b.style.setProperty('left',`${p.x*100}%`,'important');b.style.setProperty('top',`${p.y*100}%`,'important');b.style.setProperty('width',`${qolSettings.controlSize}px`,'important');b.style.setProperty('height',`${qolSettings.controlSize}px`,'important');b.style.setProperty('min-width',`${qolSettings.controlSize}px`,'important');b.style.setProperty('min-height',`${qolSettings.controlSize}px`,'important');b.style.opacity=String(qolSettings.opacity);});
  safeStorage.setItem('stickmurai_qol',JSON.stringify(qolSettings)); window.dispatchEvent(new Event('qol-audio'));
}
function controlPosition(id:string,i:number):Position {
  const w=innerWidth,h=innerHeight,s=qolSettings.controlSize;
  const natural=[{x:w-s*.85,y:h-s*.9},{x:w-s*2.05,y:h-s*.9},{x:w-s*.85,y:h-s*2.1},{x:w-s*2.05,y:h-s*2.1}][i];
  const p=qolSettings.positions[id]||{x:qolSettings.handed==='left'?1-natural.x/w:natural.x/w,y:natural.y/h};
  return {x:clamp(p.x,(s/2+12)/w,1-(s/2+12)/w),y:clamp(p.y,(s/2+12)/h,1-(s/2+12)/h)};
}
function readSave():SaveFile {const data:Record<string,string>={};for(const k of SAVE_KEYS){const v=safeStorage.getItem(k);if(v!==null)data[k]=v;}return {game:'stickmurai',version:1,savedAt:new Date().toISOString(),data};}
function downloadSave(){const blob=new Blob([JSON.stringify(readSave(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`stickmurai-save-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Save exported. Keep this file somewhere safe.');}
function replaceSave(file:SaveFile) {
  if(globals.gameState!=='mainmenu')throw Error('Return to the title menu before restoring a save.');
  // Snapshot first; rollback atomically if a storage write fails.
  const previous=readSave();safeStorage.setItem('stickmurai_save_backup',JSON.stringify(previous));
  for(const k of SAVE_KEYS){if(file.data[k]===undefined)safeStorage.removeItem(k);else safeStorage.setItem(k,file.data[k]);}
  location.reload();
}
export function initQol() {
  const toast=document.createElement('div');toast.id='qol-toast';toast.hidden=true;toast.setAttribute('role','status');document.body.append(toast);
  window.addEventListener('qol-toast',e=>showToast(String((e as CustomEvent).detail)));
  const prefs=panel('qol-settings',text('Comfort & controls','操作と表示'));
  const scroll=document.createElement('div');scroll.className='qol-scroll';prefs.box.append(scroll);
  const addSelect=(label:string,key:'size'|'handed',opts:string[])=>{const row=document.createElement('label');row.className='qol-row';row.textContent=label;const select=document.createElement('select');select.setAttribute('aria-label',label);opts.forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=value;select.append(o);});select.value=qolSettings[key];select.onchange=()=>{qolSettings[key]=select.value;if(key==='handed')qolSettings.positions={};applySettings();};row.append(select);scroll.append(row);};
  const addRange=(label:string,key:'controlSize'|'opacity'|'sensitivity'|'buffer'|'sfx',min:number,max:number,step:number)=>{const row=document.createElement('label');row.className='qol-row';const name=document.createElement('span');const input=document.createElement('input');input.type='range';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(qolSettings[key]);input.setAttribute('aria-label',label);const update=()=>{name.textContent=`${label}: ${key==='buffer'?qolSettings[key]+' ms':key==='controlSize'?qolSettings[key]+' px':Math.round(qolSettings[key]*100)+'%'}`;};update();input.oninput=()=>{qolSettings[key]=Number(input.value);update();applySettings();};row.append(name,input);scroll.append(row);};
  addSelect('Text & HUD','size',['small','default','large']);addSelect('Action hand','handed',['right','left']);addRange('Button size','controlSize',48,100,2);addRange('Button opacity','opacity',.3,1,.05);addRange('Joystick sensitivity','sensitivity',.5,1.5,.1);addRange('Input buffer (solo)','buffer',0,120,20);addRange('Sound effects','sfx',0,1,.05);
  const note=document.createElement('p');note.className='qol-note';note.textContent='Buffering remembers one early attack or dash. 0 ms disables it. Move controls in the layout editor; practice lets you test them.';scroll.append(note);
  const actions=document.createElement('div');actions.className='qol-actions';prefs.box.append(actions);
  const layout=panel('qol-layout','Move your controls');const desc=document.createElement('p');desc.textContent='Drag each circle. Positions are saved for this device. Keep buttons apart and away from the camera cutout.';layout.box.append(desc);
  const renderLayout=()=>{layout.p.querySelectorAll('.qol-drag').forEach(e=>e.remove());['btn-attack','btn-dash','btn-enhance','btn-ult'].forEach((id,i)=>{const b=document.createElement('button');b.className='qol-drag';b.textContent=['Attack','Dash','Skill','Ultimate'][i];const pos=controlPosition(id,i);b.style.left=pos.x*100+'%';b.style.top=pos.y*100+'%';b.style.width=b.style.height=qolSettings.controlSize+'px';let dragging=false;b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();dragging=true;b.setPointerCapture(e.pointerId);};b.onpointermove=e=>{if(!dragging)return;const margin=qolSettings.controlSize/2+12;const x=clamp(e.clientX,margin,innerWidth-margin)/innerWidth,y=clamp(e.clientY,margin,innerHeight-margin)/innerHeight;qolSettings.positions[id]={x,y};b.style.left=x*100+'%';b.style.top=y*100+'%';applySettings();};b.onpointerup=b.onpointercancel=()=>dragging=false;layout.p.append(b);});};
  layout.box.append(button('Save & Back',()=>layout.p.hidden=true));
  actions.append(button('Move buttons',()=>{layout.p.hidden=false;renderLayout();}),button('Restore controls',()=>{qolSettings={...defaults,sfx:qolSettings.sfx,music:qolSettings.music,positions:{}};applySettings();prefs.p.hidden=true;showToast('Default controls restored.');}),button('Back',()=>prefs.p.hidden=true));
  const settings=document.querySelector('#settings-screen .menu-box');settings?.append(button('Comfort & controls',()=>prefs.p.hidden=false));
  const save=panel('qol-saves','Save protection');const saveText=document.createElement('p');saveText.textContent='Export a local backup to move or protect your progress. Import replaces progression and keeps a recovery backup. Return to the title menu before importing. Settings and account credentials are excluded.';save.box.append(saveText);
  const confirm=panel('qol-import-confirm','Replace local progress?');const confirmText=document.createElement('p');confirm.box.append(confirmText);let pending:SaveFile|null=null;
  confirm.box.append(button('Replace & reload',()=>{if(!pending)return;try{replaceSave(pending);}catch(e){showToast((e as Error).message);}}),button('Cancel',()=>{pending=null;confirm.p.hidden=true;}));
  const present=(file:SaveFile)=>{pending=file;confirmText.textContent=`Saved ${file.savedAt.slice(0,10)} · Stage ${file.data.stickmurai_max_stage||1} · Currency ${file.data.stickmurai_magatama||0}. Current progress will be backed up first.`;confirm.p.hidden=false;};
  const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.onchange=async()=>{try{const f=file.files?.[0];if(!f)return;if(f.size>1_000_000)throw Error('Save file is too large.');present(validateSave(await f.text()));}catch(e){showToast((e as Error).message);}finally{file.value='';}};save.box.append(file);
  save.box.append(button('Export save',downloadSave),button('Import save',()=>{if(globals.gameState!=='mainmenu'){showToast('Return to the title menu first.');return;}file.click();}),button('Restore backup',()=>{try{const raw=safeStorage.getItem('stickmurai_save_backup');if(!raw)throw Error('No recovery backup yet.');present(validateSave(raw));}catch(e){showToast((e as Error).message);}}),button('Back',()=>save.p.hidden=true));
  settings?.append(button('Save protection',()=>save.p.hidden=false));
  const resume=panel('qol-resume','Ready?');const count=document.createElement('div');count.id='qol-count';resume.box.append(count,button('Stay paused',cancelResume));
  const focusLost=()=>{clearGameInputs();cancelResume();if(globals.gameMode!=='pvp'&&globals.gameState==='playing')document.getElementById('pause-btn')?.click();};
  window.addEventListener('blur',focusLost);document.addEventListener('visibilitychange',()=>{if(document.hidden)focusLost();});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&handleBack(e))e.stopImmediatePropagation();},true);
  const network=document.createElement('div');network.id='qol-network';document.querySelector('#main-menu .menu-box')?.append(network);
  const net=()=>{network.textContent=navigator.onLine?'Solo ready · Online services checked when connecting':'Offline · Solo play is available; multiplayer needs a connection';};net();window.addEventListener('online',net);window.addEventListener('offline',net);
  const music=document.getElementById('bgm-volume') as HTMLInputElement|null;if(music){music.value=String(qolSettings.music);music.addEventListener('input',()=>{qolSettings.music=Number(music.value);safeStorage.setItem('stickmurai_qol',JSON.stringify(qolSettings));});}
  window.addEventListener('resize',applySettings);applySettings();
}
