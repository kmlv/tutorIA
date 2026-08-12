import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base=path.join(os.homedir(),'Library/Caches/ms-playwright');
const d=fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe=path.join(base,d,'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser=await chromium.launch({executablePath:exe,args:['--autoplay-policy=no-user-gesture-required']});
const page=await (await browser.newContext({viewport:{width:1280,height:1400}})).newPage();
const answers=[]; const nextIds=[]; const verdicts=[];
page.on('pageerror',e=>console.log('  JS ERROR:',String(e).slice(0,200)));
page.on('request',r=>{ if(r.method()==='POST'&&r.url().includes('/answer')) answers.push(r.postData()); });
page.on('response',async r=>{const u=r.url();
  if(u.includes('/next')){try{const j=JSON.parse(await r.text()); nextIds.push(j.question? j.question.id+'['+(j.question.manip_modo||j.question.modalidad)+']':'DONE:'+j.done);}catch(e){}}
  if(u.includes('/answer')){try{verdicts.push((await r.text()).slice(0,120));}catch(e){}}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000});
await page.evaluate(()=>{window.__tutoria.practice.start();return 1;});

// arrastre PRECISO de la recta a x0=50, y0=150 (deriva la escala de los tiradores)
async function rectaCorrecta(objX,objY){
  const g=await page.evaluate(()=>{const c=document.querySelectorAll('.capa-manip circle[r="20"]');
    if(c.length<2)return null; const a=c[0].getBoundingClientRect(),b=c[1].getBoundingClientRect();
    return {hx:a.x+a.width/2,hy:a.y+a.height/2, vx:b.x+b.width/2,vy:b.y+b.height/2};});
  if(!g)return false;
  // hitX en (X(33.33), Y(0)) ; hitY en (X(0), Y(100))
  const x0px=g.vx, y0px=g.hy;                 // X(0) y Y(0)
  const sx=(g.hx-x0px)/(100/3);               // px por unidad en x
  const sy=(g.vy-y0px)/100;                   // px por unidad en y (negativo)
  const tx=x0px+objX*sx, ty=y0px+objY*sy;
  await page.mouse.move(g.hx,g.hy); await page.mouse.down(); await page.mouse.move(tx,g.hy,{steps:12}); await page.mouse.up();
  await page.waitForTimeout(120);
  const g2=await page.evaluate(()=>{const c=document.querySelectorAll('.capa-manip circle[r="20"]');
    const b=c[1].getBoundingClientRect(); return {vx:b.x+b.width/2,vy:b.y+b.height/2};});
  await page.mouse.move(g2.vx,g2.vy); await page.mouse.down(); await page.mouse.move(g2.vx,ty,{steps:12}); await page.mouse.up();
  return true;
}
let hallado=false;
for(let i=0;i<40;i++){
  await page.waitForTimeout(1100);
  const q=await page.evaluate(()=>{const qs=document.querySelectorAll('.q'); const q=qs[qs.length-1]; if(!q)return null;
    return {cls:q.className, enun:q.querySelector('.q-enunciado')?.textContent.trim().slice(0,66),
      nota:q.querySelector('.q-nota')?.textContent.trim()||null, opts:q.querySelectorAll('.q-opciones button').length,
      inp:!!q.querySelector('.q-input'), ta:!!q.querySelector('.q-textarea')};});
  if(!q){console.log('iter',i,'sin .q'); break;}
  console.log(`iter ${i}: ${q.cls} | ${q.enun} | nota=${q.nota}`);
  if(q.cls.includes('q-manip') && q.nota && q.nota.includes('punto')){
    hallado=true;
    console.log('  >>> MODO PUNTO. Pulso "Listo" SIN TOCAR el grafico.');
    const n0=answers.length;
    const m0=await page.evaluate(()=>Array.from(document.querySelectorAll('.dock .msg')).map(n=>n.textContent.trim()).join('|'));
    const c0=await page.evaluate(()=>document.querySelectorAll('.q-manip').length);
    await page.evaluate(()=>{const bs=Array.from(document.querySelectorAll('.q-manip button.primario')).filter(b=>!b.disabled); bs[bs.length-1].click();});
    await page.waitForTimeout(2600);
    const m1=await page.evaluate(()=>Array.from(document.querySelectorAll('.dock .msg')).map(n=>n.textContent.trim()).join('|'));
    const c1=await page.evaluate(()=>document.querySelectorAll('.q-manip').length);
    console.log('  >>> POST /answer nuevos      :',answers.length-n0);
    console.log('  >>> mensajes tutor identicos :',m0===m1);
    console.log('  >>> tarjetas manip antes/desp:',c0,'->',c1);
    console.log('  >>> /next anterior=',nextIds[nextIds.length-2],' nuevo=',nextIds[nextIds.length-1]);
    break;
  }
  if(q.opts>0) await page.evaluate(()=>{const qs=document.querySelectorAll('.q'); qs[qs.length-1].querySelectorAll('.q-opciones button')[0].click();});
  else if(q.inp) await page.evaluate(()=>{const qs=document.querySelectorAll('.q'); const f=qs[qs.length-1];
    const t=f.querySelector('.q-enunciado').textContent; let v='0';
    if(/ingreso sube/.test(t)) v='150';
    else if(/todo en jugo/.test(t)) v='100';
    else if(/todo en caf/.test(t)) v='33.3';
    else if(/pendiente/.test(t)) v='-3';
    else if(/12 kg/.test(t)) v='64';
    f.querySelector('.q-input').value=v; f.querySelector('form').requestSubmit();});
  else if(q.ta) await page.evaluate(()=>{const qs=document.querySelectorAll('.q'); const f=qs[qs.length-1]; f.querySelector('.q-textarea').value='La linea es la frontera del conjunto presupuestario; el conjunto incluye todas las canastas por debajo, no solo las de la frontera.'; f.querySelector('form').requestSubmit();});
  else if(q.cls.includes('q-manip')){ const pr=/precio/i.test(q.enun); await rectaCorrecta(pr?25:50, pr?100:150); await page.waitForTimeout(350);
    await page.evaluate(()=>{const bs=Array.from(document.querySelectorAll('.q-manip button.primario')).filter(b=>!b.disabled); if(bs.length)bs[bs.length-1].click();}); }
}
console.log('\nhallado modo punto:',hallado);
console.log('secuencia /next:',nextIds.join(' -> '));
console.log('POST /answer:',answers.length); answers.forEach((a,i)=>console.log('   ',a,' => ',verdicts[i]));
await browser.close();
