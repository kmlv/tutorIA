import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page, limite=40000){
  const t0=Date.now();
  while(Date.now()-t0<limite){ if(await page.evaluate(()=>!!document.querySelector('.q'))) return true; await new Promise(r=>setTimeout(r,200)); }
  return false;
}
const visQ = () => {
  const q = document.querySelector('.q'); const dock=document.querySelector('.dock');
  if(!q) return null;
  const r=q.getBoundingClientRect(); const st=getComputedStyle(q); const sd=dock?getComputedStyle(dock):null;
  const rd = dock? dock.getBoundingClientRect():null;
  return {qRect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, qOpacity:st.opacity, qDisplay:st.display,
          dockClass: dock?dock.className:null, dockOpacity: sd?sd.opacity:null, dockTransform: sd?sd.transform:null, dockRect: rd?{x:Math.round(rd.x),y:Math.round(rd.y),w:Math.round(rd.width)}:null};
};
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await page.evaluate(()=>window.__tutoria.media.seek(85));
await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play());
await esperaQ(page);
console.log('VIS con pregunta activa:', JSON.stringify(await page.evaluate(visQ)));
await page.click('.q-opciones button:nth-child(1)');
await new Promise(r=>setTimeout(r,1500));
console.log('VIS tras responder:', JSON.stringify(await page.evaluate(visQ)));
await page.evaluate(()=>{window.__tutoria.media.pause(); window.__tutoria.media.seek(85);});
await new Promise(r=>setTimeout(r,500));
await page.evaluate(()=>window.__tutoria.media.play());
for(let i=0;i<12;i++){
  await new Promise(r=>setTimeout(r,600));
  const x = await page.evaluate(snapFn);
  const v = await page.evaluate(visQ);
  console.log(' t=',x.t,'paused=',x.paused,'dock=',x.dockEstado, 'opc=', x.q?x.q.opciones.map(o=>o.cls+(o.dis?'/D':'')).join(','):'-', 'dockRect=', v?JSON.stringify(v.dockRect):'-');
  if(x.t>90) break;
}
await page.screenshot({path:'sh-R2.png'});
await browser.close();
