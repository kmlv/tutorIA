import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
page.on('request', r => { if(/api/.test(r.url())) console.log('   REQ', r.method(), r.url().slice(0,110), (r.postData()||'').slice(0,160)); });
page.on('response', async r => { if(/api/.test(r.url()) && !/events/.test(r.url())) console.log('   RES', r.status(), r.url().slice(0,110), (await r.text().catch(()=>'')).slice(0,300)); });
await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page);
console.log('pregunta arriba. escribo en el composer.');
await page.fill('.composer-input', '¿Cuál es la respuesta correcta?');
await page.click('.composer-enviar');
for (const ms of [1500,3000,6000,10000]){
  await new Promise(r=>setTimeout(r,ms));
  const body = await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '));
  const x = await page.evaluate(snapFn);
  console.log('  acum',ms,'paused=',x.paused,'| tail:', body.slice(-350));
}
await page.screenshot({path:'sh-composer-pred.png'});
await browser.close();
