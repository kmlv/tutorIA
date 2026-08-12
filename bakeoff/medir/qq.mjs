import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
let last=null;
page.on('response', async r=>{ if(/\/chat/.test(r.url())) last = (await r.text().catch(()=>'')).slice(0,200); });
// abrir el dock sin pregunta
await page.evaluate(()=>window.__tutoria.media.seek(60)); await new Promise(r=>setTimeout(r,300));
await page.click('#ask'); await new Promise(r=>setTimeout(r,400));
for(let i=1;i<=14;i++){
  await page.fill('.composer-input', 'pregunta numero '+i+' sobre la linea presupuestaria');
  await page.click('.composer-enviar');
  await new Promise(r=>setTimeout(r,2500));
  const rest = await page.evaluate(()=>document.querySelector('.composer-restantes')?.innerText || '');
  const inputDis = await page.evaluate(()=>({dis:document.querySelector('.composer-input')?.disabled, btn:document.querySelector('.composer-enviar')?.disabled}));
  console.log(i, 'restantes="'+rest+'"', JSON.stringify(inputDis), '| resp:', (last||'').slice(0,110));
  if(inputDis.dis || inputDis.btn) { console.log('  -> composer bloqueado en la pregunta', i); break; }
}
// ahora ir a una prediccion
await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,400));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,500));
const st = await page.evaluate(()=>({
  q: !!document.querySelector('.q'),
  inputDis: document.querySelector('.composer-input')?.disabled,
  btnDis: document.querySelector('.composer-enviar')?.disabled,
  rest: document.querySelector('.composer-restantes')?.innerText,
  chips: [...document.querySelectorAll('.intencion')].map(b=>b.innerText+(b.disabled?'/DIS':''))
}));
console.log('EN LA PREDICCION con cupo agotado:', JSON.stringify(st));
// probar chip y composer
await page.evaluate(()=>{[...document.querySelectorAll('.intencion')].find(b=>b.innerText.trim()==='No entiendo')?.click();});
await new Promise(r=>setTimeout(r,2500));
console.log('tras chip:', (await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '))).slice(-200));
await page.fill('.composer-input','sigo sin entender, ayudame');
await page.click('.composer-enviar').catch(e=>console.log('  click enviar falló:', String(e).slice(0,80)));
await new Promise(r=>setTimeout(r,3000));
console.log('tras composer:', (await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '))).slice(-260));
await page.screenshot({path:'sh-cupo-agotado-pred.png'});
await browser.close();
