import {abrir} from './lib.mjs';
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
for (const t of [90,110,130,160,170,176,185,200,215]){
  await page.evaluate((x)=>window.__tutoria.media.seek(x), t); await new Promise(r=>setTimeout(r,350));
  const b = await page.evaluate(()=>document.querySelector('.bands')?.innerText.replace(/\n+/g,' · '));
  console.log('t='+t, '->', b);
}
await browser.close();
