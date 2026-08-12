import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page, limite=40000){const t0=Date.now();while(Date.now()-t0<limite){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
const visQ = () => { const q=document.querySelector('.q'); const d=document.querySelector('.dock');
  const rd=d?d.getBoundingClientRect():null; return {qDom:!!q, dockW: rd?Math.round(rd.width):null, dockOp: d?getComputedStyle(d).opacity:null, qTxt:q?q.innerText.replace(/\n+/g,' / ').slice(0,70):null, qDis: q?[...q.querySelectorAll('.q-opciones button')].map(b=>b.disabled).join(','):null}; };
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await page.evaluate(()=>window.__tutoria.media.seek(85));
await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play());
await esperaQ(page);
console.log('E) pregunta activa, SIN responder. vis=', JSON.stringify(await page.evaluate(visQ)));
// el alumno rebobina para volver a oir
await page.evaluate(()=>{window.__tutoria.media.seek(78);});
await new Promise(r=>setTimeout(r,700));
let x = await page.evaluate(snapFn); let v = await page.evaluate(visQ);
console.log('E) tras seek(78) t=',x.t,'paused=',x.paused,'dock=',x.dockEstado,'vis=',JSON.stringify(v));
console.log('   cap=', x.captions.split(' | ')[0].slice(0,80));
await page.screenshot({path:'sh-E-rebobina-sin-responder.png'});
await page.evaluate(()=>window.__tutoria.media.play());
for(let i=0;i<14;i++){
  await new Promise(r=>setTimeout(r,600));
  x = await page.evaluate(snapFn);
  console.log('   t=',x.t,'paused=',x.paused,'dock=',x.dockEstado, 'qDis=', (await page.evaluate(visQ)).qDis);
  if(x.t>90) break;
}
await page.screenshot({path:'sh-E2.png'});
await browser.close();
