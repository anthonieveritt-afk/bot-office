// Parses /home/box/shared/bot-schedule.md every 30s, writes status.json, commits+pushes when changed (max once/min).
const fs=require('fs'),{execSync}=require('child_process'),path=require('path');
const LOG='/home/box/shared/bot-schedule.md',DIR=__dirname,OUT=path.join(DIR,'status.json');
const DONE=/^(done|complete|completed|finished)$/i;let lastPush=0,lastKey='',lastHeartbeat=0;
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});
const clean=s=>String(s||'').replace(/https?:\S+|\S+@\S+/g,'').replace(/[^\w\s.,:()'&\/+\-–—£$%!?]/g,'').trim().slice(0,90);
function build(){const bots={},t=today();let lines=[];try{lines=fs.readFileSync(LOG,'utf8').split('\n')}catch(e){}
 for(const l of lines){const p=l.split('|').map(s=>s.trim());if(p.length<7||!/^\d{4}-\d{2}-\d{2}$/.test(p[0]))continue;
  const [date,bot,task,started,eta,actual,status]=p;const n=clean(bot);if(!n)continue;const b=bots[n]||(bots[n]={status:'idle',tasks:[]});
  b.last={date,task:clean(task)};
  if(date===t&&!actual&&!DONE.test(status)){b.status='working';b.tasks.push({task:clean(task),started:clean(started),eta:clean(eta)})}}
 return bots}
function tick(){const bots=build(),key=JSON.stringify(bots),now=Date.now();
 const changed=key!==lastKey,heartbeat=now-lastHeartbeat>10*60e3;
 if((changed||heartbeat)&&now-lastPush>=60e3){
  fs.writeFileSync(OUT,JSON.stringify({generated:new Date().toISOString(),bots},null,1));
  try{execSync('git add status.json && (git diff --cached --quiet || git commit -qm "status update") && git push -q',{cwd:DIR,stdio:'pipe'});
   lastPush=now;lastKey=key;lastHeartbeat=now;console.log(new Date().toISOString(),'pushed')}catch(e){console.error('push failed',e.message)}}}
tick();setInterval(tick,30e3);
