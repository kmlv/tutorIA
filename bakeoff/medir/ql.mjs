import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
for (const [ts,id] of [[78,'line_vs_set'],[111,'slope_sign'],[159,'price_effect']]){
  const {browser,page} = await abrir('http://localhost:57330/?lang=en');
  await page.evaluate((t)=>window.__tutoria.media.seek(t), ts); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  const ok = await esperaQ(page, 25000); await new Promise(r=>setTimeout(r,500));
  const x = await page.evaluate(snapFn);
  console.log('EN', id, ok?('t='+x.t):'NO');
  if(ok){ console.log('   Q :', x.q.text.slice(0,180)); console.log('   CAP:', x.captions.split(' | ')[0].slice(0,160)); }
  await browser.close();
}
