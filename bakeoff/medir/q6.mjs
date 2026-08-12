import {abrir, snapFn} from './lib.mjs';
async function llegar(page, ts){
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,200));
  await page.evaluate(()=>window.__tutoria.media.play());
  await page.waitForFunction('document.querySelector(".q")', null, {timeout:25000});
  await new Promise(r=>setTimeout(r,600));
}
for (const [ts,label] of [[143,'CHECKPOINT cp1 @144.76'],[174.5,'PREDICCION price_effect @176.13']]){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await llegar(page, ts);
  const b = await page.$eval('#play', x=>({txt:x.innerText, dis:x.disabled, cls:x.className}));
  console.log(label, 'boton play ->', JSON.stringify(b));
  await page.click('#play');
  await new Promise(r=>setTimeout(r,2500));
  const x = await page.evaluate(snapFn);
  console.log('   tras pulsar play: t=',x.t,'paused=',x.paused,'q sigue?',!!x.q,'cap=',x.captions.split(' | ')[0].slice(0,80));
  await browser.close();
}
