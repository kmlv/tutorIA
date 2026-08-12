import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
page.on('close', ()=>console.log('  !! page close'));
page.on('crash', ()=>console.log('  !! page crash'));
browser.on('disconnected', ()=>console.log('  !! browser disconnected'));
let resp=null; page.on('response', async r=>{ if(/\/answer/.test(r.url())) resp=(await r.text().catch(()=>'')).slice(0,200); });
await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page);
for (let i=1;i<=8;i++){
  await new Promise(r=>setTimeout(r,10000));
  try {
    const x = await page.evaluate(snapFn);
    console.log(i*10+'s: t=',x.t,'paused=',x.paused,'q?',!!x.q,'dock=',x.dockEstado);
  } catch(e){ console.log(i*10+'s: FALLO evaluate ->', String(e).slice(0,120)); break; }
}
try{ await page.click('.q-opciones button:nth-child(1)'); await new Promise(r=>setTimeout(r,2000));
  const x=await page.evaluate(snapFn); console.log('tras responder tarde: t=',x.t,'paused=',x.paused,'servidor=',resp);
}catch(e){ console.log('click falló:', String(e).slice(0,150)); }
await browser.close().catch(()=>{});
