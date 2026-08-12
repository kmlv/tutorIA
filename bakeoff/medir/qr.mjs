import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
for (const [ts,id] of [[85,'line_vs_set'],[122,'slope_sign'],[174.5,'price_effect']]){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate((t)=>window.__tutoria.media.seek(t), ts); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  await esperaQ(page);
  const e0 = await page.evaluate(()=>JSON.parse(JSON.stringify(window.__tutoria.estado())));
  await new Promise(r=>setTimeout(r,1500));
  const e1 = await page.evaluate(()=>JSON.parse(JSON.stringify(window.__tutoria.estado())));
  console.log('\n'+id);
  console.log('  al aparecer :', JSON.stringify(e0));
  console.log('  +1.5s pausado:', JSON.stringify(e1));
  await page.screenshot({path:`sh-graf-${id}.png`});
  await browser.close();
}
