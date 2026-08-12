import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
for (const [ts,label,opt] of [[85,'PREDICCION line_vs_set',3],[143,'CHECKPOINT cp1',2]]){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  page.on('response', async r => { if(/api/.test(r.url()) && !/events/.test(r.url())) {
    console.log('   ', r.request().method(), r.url().replace('http://localhost:57330',''), '=>', r.status(), (await r.text().catch(()=>'')).slice(0,500)); }});
  page.on('request', q => { if(/api/.test(q.url()) && !/events/.test(q.url())) console.log('   POST body:', (q.postData()||'').slice(0,200)); });
  await page.evaluate((t)=>window.__tutoria.media.seek(t), ts); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,400));
  console.log('\n###', label, '- respondiendo MAL (opcion '+opt+')');
  await page.click(`.q-opciones button:nth-child(${opt})`);
  await new Promise(r=>setTimeout(r,3000));
  await browser.close();
}
