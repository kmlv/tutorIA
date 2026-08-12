import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await page.evaluate(()=>window.__tutoria.media.seek(60)); await new Promise(r=>setTimeout(r,300));
await page.click('#ask'); await new Promise(r=>setTimeout(r,400));
for(let i=1;i<=14;i++){
  const antes = await page.evaluate(()=>document.querySelector('.dock-body').innerText.length);
  await page.fill('.composer-input', 'duda '+i+' sobre la recta presupuestaria');
  const dis = await page.evaluate(()=>document.querySelector('.composer-enviar').disabled);
  if(dis){ console.log(i,'boton deshabilitado antes de enviar'); break; }
  await page.click('.composer-enviar');
  // esperar a que crezca el body (llegó respuesta) o 20s
  const t0=Date.now(); while(Date.now()-t0<20000){ const n = await page.evaluate(()=>document.querySelector('.dock-body').innerText.length); if(n>antes+40) break; await new Promise(r=>setTimeout(r,300)); }
  const st = await page.evaluate(()=>({rest:document.querySelector('.composer-restantes')?.innerText, dis:document.querySelector('.composer-input')?.disabled, btn:document.querySelector('.composer-enviar')?.disabled}));
  console.log(i, JSON.stringify(st));
  if(st.dis===true && st.btn===true && (st.rest||'').match(/^0|sin/i)) break;
}
const fin = await page.evaluate(()=>({rest:document.querySelector('.composer-restantes')?.innerText, dis:document.querySelector('.composer-input')?.disabled, btn:document.querySelector('.composer-enviar')?.disabled, tail: document.querySelector('.dock-body').innerText.replace(/\n+/g,' | ').slice(-200)}));
console.log('FIN cupo:', JSON.stringify(fin));
// ahora a la prediccion
await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,400));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,600));
const st2 = await page.evaluate(()=>({q:!!document.querySelector('.q'), rest:document.querySelector('.composer-restantes')?.innerText, dis:document.querySelector('.composer-input')?.disabled, btn:document.querySelector('.composer-enviar')?.disabled}));
console.log('EN PREDICCION:', JSON.stringify(st2));
await page.evaluate(()=>{[...document.querySelectorAll('.intencion')].find(b=>b.innerText.trim()==='No entiendo')?.click();});
await new Promise(r=>setTimeout(r,3000));
console.log('tras chip:', (await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '))).slice(-160));
await page.screenshot({path:'sh-cupo0-pred.png'});
await browser.close();
