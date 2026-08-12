import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
for (const [ts,id] of [[122,'slope_sign'],[174.5,'price_effect']]){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate((t)=>window.__tutoria.media.seek(t), ts); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,300));
  const a = await page.evaluate(()=>JSON.parse(JSON.stringify(window.__tutoria.estado())));
  await page.click('.q-opciones button:nth-child(1)');
  await new Promise(r=>setTimeout(r,1200));
  const b = await page.evaluate(()=>JSON.parse(JSON.stringify(window.__tutoria.estado())));
  console.log(id, '\n  antes :', JSON.stringify(a), '\n  después:', JSON.stringify(b));
  await browser.close();
}
