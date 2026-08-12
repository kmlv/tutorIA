import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base=path.join(os.homedir(),'Library/Caches/ms-playwright');
const d=fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe=path.join(base,d,'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser=await chromium.launch({executablePath:exe,args:['--autoplay-policy=no-user-gesture-required']});
const page=await (await browser.newContext({viewport:{width:1280,height:1400}})).newPage();
const answers=[]; const nextIds=[];
page.on('pageerror',e=>console.log('  JS ERROR:',String(e).slice(0,200)));
page.on('request',r=>{ if(r.method()==='POST'&&r.url().includes('/answer')) answers.push(r.postData()); });
page.on('response',async r=>{ if(r.url().includes('/next')){try{const j=JSON.parse(await r.text());
  nextIds.push(j.question? j.question.id+'['+(j.question.manip_modo||j.question.modalidad)+']' : 'DONE:'+j.done);}catch(e){}}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000});
await page.evaluate(()=>{window.__tutoria.practice.start();return 1;});

// arrastre REAL de la recta: mover tirador X y tirador Y
async function arrastrarRecta(){
  const h=await page.evaluate(()=>{ const c=document.querySelectorAll('.capa-manip circle[r="20"]');
    if(c.length<2) return null; const a=c[0].getBoundingClientRect(), b=c[1].getBoundingClientRect();
    return {x1:a.x+a.width/2,y1:a.y+a.height/2,x2:b.x+b.width/2,y2:b.y+b.height/2}; });
  if(!h) return false;
  await page.mouse.move(h.x1,h.y1); await page.mouse.down();
  await page.mouse.move(h.x1+60,h.y1,{steps:8}); await page.mouse.up();
  await page.mouse.move(h.x2,h.y2); await page.mouse.down();
  await page.mouse.move(h.x2,h.y2-60,{steps:8}); await page.mouse.up();
  return true;
}
for(let i=0;i<20;i++){
  await page.waitForTimeout(1100);
  const q=await page.evaluate(()=>{const qs=document.querySelectorAll('.q'); const q=qs[qs.length-1]; if(!q)return null;
    return {cls:q.className, enun:q.querySelector('.q-enunciado')?.textContent.trim().slice(0,70),
      nota:q.querySelector('.q-nota')?.textContent.trim()||null, opts:q.querySelectorAll('.q-opciones button').length,
      inp: !!q.querySelector('.q-input'), ta: !!q.querySelector('.q-textarea')};});
  if(!q){console.log('iter',i,'sin .q');break;}
  console.log(`iter ${i}: ${q.cls} | ${q.enun} | nota=${q.nota}`);
  if(q.cls.includes('q-manip') && q.nota && q.nota.includes('punto')){
    console.log('  >>> MODO PUNTO (q_feas_manip presumible). Pulsando Listo SIN TOCAR.');
    const n0=answers.length;
    const m0=await page.evaluate(()=>Array.from(document.querySelectorAll('.dock .msg')).map(n=>n.textContent.trim()).join('|'));
    const c0=await page.evaluate(()=>document.querySelectorAll('.q-manip').length);
    await page.evaluate(()=>{const bs=Array.from(document.querySelectorAll('.q-manip button.primario')).filter(b=>!b.disabled); bs[bs.length-1].click();});
    await page.waitForTimeout(2500);
    const m1=await page.evaluate(()=>Array.from(document.querySelectorAll('.dock .msg')).map(n=>n.textContent.trim()).join('|'));
    const c1=await page.evaluate(()=>document.querySelectorAll('.q-manip').length);
    console.log('  >>> POST /answer nuevos:',answers.length-n0);
    console.log('  >>> mensajes tutor identicos:',m0===m1);
    console.log('  >>> tarjetas manip antes/despues:',c0,'->',c1);
    console.log('  >>> /next: anterior=',nextIds[nextIds.length-2],' nuevo=',nextIds[nextIds.length-1]);
    break;
  }
  if(q.opts>0) await page.evaluate(()=>{const qs=document.querySelectorAll('.q'); qs[qs.length-1].querySelectorAll('.q-opciones button')[0].click();});
  else if(q.inp){ await page.evaluate(()=>{const qs=document.querySelectorAll('.q'); const inp=qs[qs.length-1].querySelector('.q-input'); inp.value='50'; qs[qs.length-1].querySelector('form').requestSubmit();}); }
  else if(q.ta){ await page.evaluate(()=>{const qs=document.querySelectorAll('.q'); qs[qs.length-1].querySelector('.q-textarea').value='la recta se desplaza hacia afuera de forma paralela'; qs[qs.length-1].querySelector('form').requestSubmit();}); }
  else if(q.cls.includes('q-manip')){ await arrastrarRecta(); await page.waitForTimeout(300);
    await page.evaluate(()=>{const bs=Array.from(document.querySelectorAll('.q-manip button.primario')).filter(b=>!b.disabled); if(bs.length)bs[bs.length-1].click();}); }
}
console.log('\nsecuencia /next:',nextIds.join(' -> '));
console.log('POST /answer enviados:',answers.length); answers.forEach(a=>console.log('   ',a));
await browser.close();
