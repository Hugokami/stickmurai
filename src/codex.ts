import { globals } from './globals';
import { safeStorage } from './storage';

const entries = [
  ['brawler','Brawler','Melee','Sidestep the amber lunge and strike during recovery.'],
  ['samurai','Samurai','Melee','Parry a committed strike to build posture damage.'],
  ['giant','Giant','Heavy','Keep clear of the impact circle; punish after the slam.'],
  ['assassin','Assassin','Fast','Keep moving and dodge after its aim locks.'],
  ['berserker','Berserker','Heavy','Bait its charge before closing in.'],
  ['ronin','Ronin','Melee','Use short attacks between its committed lunges.'],
  ['musketeer','Musketeer','Ranged','Move across its aim line; do not retreat along it.'],
  ['pyromancer','Pyromancer','Ranged','Leave marked impact areas before the projectile lands.'],
  ['glacial_sentinel','Glacial Sentinel','Ranged','Keep room to dodge its ranged attacks.'],
  ['astromancer','Astromancer','Ranged','Watch incoming projectiles while approaching.'],
  ['necromancer','Necromancer','Summoner','Prioritize the summoner over its reinforcements.'],
  ['barrel_bomber','Barrel Bomber','Explosive','Keep your distance from the explosion.'],
  ['orc_brute','Orc Brute','Heavy','Dodge its windup and punish the recovery.'],
  ['toaster_bot','Toaster Bot','Ranged','Cross its firing line rather than standing still.'],
  ['oni_boss','Oni Overlord','Boss','Dodge the lunge. Below 66% HP, move out of marked impact circles.'],
  ['agis_colossus','Agis Colossus','Boss','Watch the slam. Later phases add rings with a safe center.'],
  ['skeleton_warlord','Skeleton Warlord','Boss','Attack during recovery for bonus damage. Later phases add three impact zones.'],
  ['shogun_boss','Supreme Shogun','Boss','Bait a committed attack, then punish recovery. Later rings have safe centers.']
] as const;
type RecordEntry = { stages: number[]; phases: number[] };
let seen: Record<string, RecordEntry> = {};
let claimed: string[] = [];
try {
  const raw = JSON.parse(safeStorage.getItem('stickmurai_codex') || '{}');
  for (const [id] of entries) {
    const item = raw.seen?.[id];
    if (item) seen[id] = {stages: Array.isArray(item.stages) ? item.stages.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>0).slice(0,100) : [], phases:Array.isArray(item.phases)?item.phases.filter((n:unknown)=>[1,2,3].includes(Number(n))):[]};
  }
  claimed = Array.isArray(raw.claimed) ? raw.claimed.filter((id:unknown)=>['families','bosses','complete'].includes(String(id))) : [];
} catch { /* A malformed codex must not block startup. */ }
const save = () => safeStorage.setItem('stickmurai_codex', JSON.stringify({version:1,seen,claimed}));
export function discoverCodex() {
  if (globals.gameState !== 'playing' || globals.gameMode !== 'classic') return;
  let changed = false;
  for (const enemy of globals.enemies) {
    if(enemy.state==='dead'||!entries.some(([id])=>id===enemy.subType))continue;
    const record = seen[enemy.subType] ||= {stages:[],phases:[]};
    if(!record.stages.includes(globals.currentStage)){record.stages.push(globals.currentStage);changed=true;}
    const phase=enemy.hp<=enemy.maxHp/3?3:enemy.hp<=enemy.maxHp*2/3?2:1;
    if(!record.phases.includes(phase)){record.phases.push(phase);changed=true;}
  }
  if(changed)save();
}
export function renderCodex(grid:HTMLElement) {
  const count=Object.keys(seen).length;
  const summary=document.createElement('section');summary.style.cssText='grid-column:1/-1;color:#f8fafc';
  summary.innerHTML=`<h2>Field Grimoire</h2><p>${count}/${entries.length} discoveries · ${Math.round(count/entries.length*100)}% complete</p><p>Encounter enemies to record their stages and counterplay. Rewards are claimed once.</p>`;
  const bosses=entries.filter(e=>e[2]==='Boss'&&seen[e[0]]).length;
  for(const [id,label,ready,reward] of [['families','Discover 7 enemy types',count>=7,500],['bosses','Discover all 4 bosses',bosses===4,1000],['complete','Complete the field codex',count===entries.length,2000]] as const){
    const button=document.createElement('button');button.textContent=claimed.includes(id)?`${label} · Claimed`:`${label} · ${reward} 🔮`;button.disabled=!ready||claimed.includes(id);
    button.onclick=()=>{if(!ready||claimed.includes(id))return;claimed.push(id);globals.magatama+=reward;save();safeStorage.setItem('stickmurai_magatama',String(globals.magatama));grid.replaceChildren();renderCodex(grid);};summary.append(button);
  }
  grid.append(summary);
  for(const [id,name,kind,tip] of entries){const record=seen[id];const card=document.createElement('article');card.className='grimoire-card';card.style.cssText='padding:16px;border:1px solid #64748b;border-radius:8px;background:#0f172a;color:#f8fafc';card.innerHTML=`<h3>${record?name:'Undiscovered '+kind}</h3><p>${record?tip:'Encounter this enemy in campaign to reveal its counterplay.'}</p>${record?`<p>Stages: ${record.stages.join(', ')}</p>${kind==='Boss'?`<p>Phases witnessed: ${record.phases.sort().join(', ')}</p>`:''}`:''}`;grid.append(card);}
}
