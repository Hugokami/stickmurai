// Local skill migration. Plans first; never overwrites an existing skill.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const home = 'C:/Users/lyan1';
const roots = [
  '.gemini/config/skills', '.gemini/antigravity/builtin/skills',
  '.gemini/config/plugins/data-agent-kit-plugin/skills',
  '.gemini/config/plugins/science/skills'
].map(p => path.join(home, p));
const installedRoots = ['.agents/skills', '.codex/skills'].map(p => path.join(home,p));
const out = path.resolve('docs/antigravity-skill-inventory.json');
function scan(root) {
  const found = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
      if (['node_modules','.git','.venv','venv','.cache'].includes(e.name)) continue;
      const p=path.join(dir,e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name==='SKILL.md') {
        const text=fs.readFileSync(p,'utf8');
        const name=text.match(/^name:\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
        if(name) found.push({name,path:p,hash:crypto.createHash('sha256').update(text).digest('hex'),description:text.match(/^description:\s*(.*)/m)?.[1] || ''});
      }
    }
  }
  walk(root); return found;
}
if(process.argv.includes('--install')) {
  const plan=JSON.parse(fs.readFileSync(out,'utf8'));
  for(const row of plan.skills.filter(r=>r.status==='missing')) {
    if(fs.existsSync(row.destination)) throw Error('Destination exists: '+row.destination);
    fs.cpSync(path.dirname(row.source),row.destination,{recursive:true,errorOnExist:true,force:false,filter:p=>!p.split(path.sep).some(x=>['.git','node_modules','.venv','venv','__pycache__'].includes(x))});
    if(fs.readFileSync(path.join(row.destination,'SKILL.md'),'utf8')!==fs.readFileSync(row.source,'utf8')) throw Error('Verification failed: '+row.name);
    row.status='installed';
  }
  fs.writeFileSync(out,JSON.stringify(plan,null,2)+'\n');
  console.log(JSON.stringify(plan.skills.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{})));
} else {
  const existing=installedRoots.flatMap(scan);
  const sources=roots.flatMap(scan).sort((a,b)=>a.path.length-b.path.length);
  const seen=new Set(); const skills=[];
  for(const s of sources) {
    if(seen.has(s.name)) continue; seen.add(s.name);
    const e=existing.find(e=>e.name===s.name);
    skills.push({name:s.name,description:s.description,source:s.path,sourceHash:s.hash,status:e?'already available':'missing',existing:e?.path,identical:e?e.hash===s.hash:undefined,destination:e?undefined:path.join(home,'.codex/skills',path.basename(path.dirname(s.path)))});
  }
  const destinations=skills.filter(r=>r.destination).map(r=>r.destination);
  if(new Set(destinations).size!==destinations.length) throw Error('Destination collision');
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify({date:'2026-09-05',sourceFiles:sources.length,skills},null,2)+'\n');
  console.log(JSON.stringify({sourceFiles:sources.length,unique:skills.length,available:skills.filter(r=>r.existing).length,missing:skills.filter(r=>!r.existing).map(r=>r.name),differentExisting:skills.filter(r=>r.existing&&!r.identical).map(r=>r.name)},null,2));
}
