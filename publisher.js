// Bot Office publisher: log + agent-data mtimes -> status.json, push within ~5s of change.
const fs=require('fs'),{execSync}=require('child_process'),path=require('path');
const LOG='/home/box/shared/bot-schedule.md',AG='/home/box/agent-data/agents',DIR=__dirname,OUT=path.join(DIR,'status.json');
const DONE=/^(done|complete|completed|finished)$/i,ACT_MS=3*60e3;
let lastKey='',lastPush=0,timer=null,busy=false;
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});
const clean=s=>String(s||'').replace(/https?:\S+|\S+@\S+/g,'').replace(/[^\w\s.,:()'&\/+\-–—£$%!?]/g,'').trim().slice(0,90);
function newest(d,depth=0){let m=0;try{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
 if(e.isDirectory()){if(depth<6&&e.name!=='node_modules'&&e.name!=='.git')m=Math.max(m,newest(p,depth+1))}else if(e.isFile()){try{m=Math.max(m,fs.statSync(p).mtimeMs)}catch(_){}}}}catch(_){}return m}
function activity(){const out={};try{for(const id of fs.readdirSync(AG)){let n;try{n=JSON.parse(fs.readFileSync(path.join(AG,id,'profile.json'),'utf8')).name}catch(_){continue}
 if(!n||n.includes(','))continue;out[clean(n)]=newest(path.join(AG,id))}}catch(_){}return out}
function build(){const bots={},t=today(),now=Date.now();let lines=[];try{lines=fs.readFileSync(LOG,'utf8').split('\n')}catch(e){}
 const get=n=>bots[n]||(bots[n]={status:'idle',tasks:[]});
 for(const l of lines){const p=l.split('|').map(s=>s.trim());if(p.length<7||!/^\d{4}-\d{2}-\d{2}$/.test(p[0]))continue;
  const [date,bot,task,started,eta,actual,status]=p;const n=clean(bot);if(!n)continue;const b=get(n);b.last={date,task:clean(task)};
  const hm=new Date().toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour12:false,hour:'2-digit',minute:'2-digit'});
  if(date===t&&!actual&&!DONE.test(status)&&!(/^\d\d:\d\d$/.test(started)&&started>hm)){b.status='working';b.tasks.push({task:clean(task),started:clean(started),eta:clean(eta)})}}
 for(const [n,m] of Object.entries(activity())){const b=get(n);b.lastActivity=m?new Date(m).toISOString():null;
  if(m&&now-m<ACT_MS&&b.status==='idle')b.status='active'}
 return bots}
function publish(force){if(busy)return;const bots=build();const key=JSON.stringify(Object.entries(bots).map(([n,b])=>[n,b.status,b.tasks]));
 const now=Date.now();if(!force&&key===lastKey)return;busy=true;
 fs.writeFileSync(OUT,JSON.stringify({generated:new Date().toISOString(),bots},null,1));
 try{execSync('git add status.json && (git diff --cached --quiet || git commit -qm "status") && git push -q',{cwd:DIR,stdio:'pipe',timeout:30e3});
  lastKey=key;lastPush=now;console.log(new Date().toISOString(),'pushed',force?'(heartbeat)':'')}catch(e){console.error('push failed',e.message)}busy=false}
const soon=()=>{clearTimeout(timer);timer=setTimeout(()=>publish(false),1500)};
try{fs.watch(path.dirname(LOG),(ev,f)=>{if(!f||f==='bot-schedule.md')soon()})}catch(e){console.error('watch failed',e.message)}
publish(true);setInterval(()=>publish(false),10e3);setInterval(()=>publish(true),5*60e3);
