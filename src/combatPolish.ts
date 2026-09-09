import { globals } from './globals';
import { callbacks } from './callbacks';
import type { Enemy } from './enemy';
import { hazardContains } from './journeyCore';
import { isPractice } from './runtimeQol';

export const isBoss = (e:{subType:string})=>['oni_boss','shogun_boss','agis_colossus','skeleton_warlord'].includes(e.subType);
interface BossMemory {phase:number;state:string;cooldown:number}
interface Hazard {x:number;y:number;radius:number;inner:number;age:number;hit:boolean;owner:Enemy;color:string;label:string}
let memories=new WeakMap<Enemy,BossMemory>();
let hazards:Hazard[]=[];
export function resetCombatPolish(){memories=new WeakMap();hazards=[];}
export function bossStatus():string {
  const boss=globals.enemies.find(e=>e.state!=='dead'&&isBoss(e));if(!boss)return '';
  const phase=memories.get(boss)?.phase||1;
  const cue=boss.postureBrokenTimer>0?'POSTURE BROKEN':boss.state==='recover'?'PUNISH WINDOW':boss.state==='charge'?'WINDUP · DODGE':'FIGHT';
  return `Phase ${phase}/3 · ${Math.max(0,Math.ceil(boss.hp))}/${boss.maxHp} HP · ${cue}`;
}
export function updateCombatPolish(dt:number){
  if(globals.gameMode!=='classic'||isPractice()||globals.gameState!=='playing')return;
  for(const e of globals.enemies){
    if(e.state==='dead'||!isBoss(e))continue;
    let memory=memories.get(e);if(!memory){memory={phase:1,state:e.state,cooldown:5};memories.set(e,memory);}
    const phase=e.hp/e.maxHp<=.33?3:e.hp/e.maxHp<=.66?2:1;
    if(phase>memory.phase){memory.phase=phase;window.dispatchEvent(new CustomEvent('qol-toast',{detail:`Boss phase ${phase} · ${phase===2?'arena hazards':'faster recovery'}`}));}
    memory.cooldown-=dt;
    if(e.state==='charge'&&memory.state!=='charge'&&phase>=2&&memory.cooldown<=0&&hazards.length===0){
      memory.cooldown=phase===3?7:10;
      const x=globals.player.x,y=globals.player.y;
      const add=(hx:number,hy:number,radius:number,inner:number,color:string,label:string)=>hazards.push({x:hx,y:hy,radius,inner,age:0,hit:false,owner:e,color,label});
      if(e.subType==='agis_colossus')add(x,y,220,95,'#67e8f9','SAFE CENTER');
      else if(e.subType==='skeleton_warlord'){for(let i=-1;i<=1;i++)add(x+i*145,y,58,0,'#fbbf24','CLEAVE');}
      else if(e.subType==='shogun_boss')add(x,y,170,70,'#c4b5fd','SAFE CENTER');
      else add(x,y,115,0,'#fb923c','MOVE OUT');
    }
    memory.state=e.state;
  }
  for(const h of hazards){
    h.age+=dt;
    if(h.owner.state==='dead'){h.hit=true;h.age=2;continue;}
    if(h.age>=1.25&&!h.hit){h.hit=true;if(globals.gameState==='playing'&&hazardContains(globals.player.x,globals.player.y,h))callbacks.checkPlayerHit(h.owner,1);}
  }
  hazards=hazards.filter(h=>h.age<1.5&&h.owner.state!=='dead');
}
// Drawn after scenery, before characters and signature VFX. No full-screen wash.
export function drawCombatHazards(ctx:CanvasRenderingContext2D){
  if(globals.gameMode!=='classic'||!['playing','paused','levelup','ultchoice'].includes(globals.gameState))return;
  for(const h of hazards){
    const x=(h.x-globals.camera.x+globals.vw/2)|0,y=(h.y-globals.camera.y+globals.vh/2)|0;
    if(x+h.radius<0||x-h.radius>globals.vw||y+h.radius<0||y-h.radius>globals.vh)continue;
    ctx.save();ctx.strokeStyle=h.color;ctx.fillStyle=h.color;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(x,y,h.radius,0,Math.PI*2);if(h.inner)ctx.arc(x,y,h.inner,0,Math.PI*2,true);
    ctx.globalAlpha=h.hit?.3:.12;ctx.fill('evenodd');ctx.globalAlpha=1;ctx.stroke();
    ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,h.radius,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,h.age/1.25));ctx.stroke();
    ctx.font="bold 14px Outfit,system-ui,sans-serif";ctx.textAlign='center';ctx.fillText(h.label,x,y-h.radius-8);ctx.restore();
  }
}
