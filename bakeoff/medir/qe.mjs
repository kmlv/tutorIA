import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
const dockW = () => { const d=document.querySelector('.dock'); return d?Math.round(d.getBoundingClientRect().width):null; };
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await page.evaluate(()=>window.__tutoria.media.seek(85));
await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play());
await esperaQ(page);
console.log('pregunta activa en t=',(await page.evaluate(snapFn)).t);
await page.evaluate(()=>{window.__tutoria.media.seek(78);});
await new Promise(r=>setTimeout(r,600));
await page.evaluate(()=>window.__tutoria.media.play());
for(let i=0;i<40;i++){
  await new Promise(r=>setTimeout(r,500));
  const x = await page.evaluate(snapFn); const w = await page.evaluate(dockW);
  if (x.t>86.5 || i%6===0) console.log('   t=',x.t,'paused=',x.paused,'dock=',x.dockEstado,'dockW=',w);
  if(x.t>92) break;
}
await page.screenshot({path:'sh-E3.png'});
await browser.close();
