import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
async function probar(label, prep){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  page.on('console', m => { if(m.type()==='error') console.log('   CONSOLE ERROR:', m.text().slice(0,200)); });
  page.on('request', r => { if(!/\.(mp3|js|css|svg|png|woff2?)/.test(r.url())) console.log('   REQ', r.method(), r.url().slice(0,120)); });
  page.on('response', r => { if(!/\.(mp3|js|css|svg|png|woff2?)/.test(r.url())) console.log('   RES', r.status(), r.url().slice(0,120)); });
  page.on('requestfailed', r => console.log('   REQ FAILED', r.url().slice(0,120), r.failure()?.errorText));
  console.log('\n#####', label);
  await prep(page);
  await page.evaluate(()=>{ [...document.querySelectorAll('.intencion')].find(b=>b.innerText.trim()==='No entiendo').click(); });
  for (const ms of [2000,5000,10000,15000]){
    await new Promise(r=>setTimeout(r,ms));
    const body = await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '));
    const x = await page.evaluate(snapFn);
    console.log('  acum '+ms,'paused=',x.paused,'| body tail:', body.slice(-220));
  }
  await browser.close();
}
await probar('PREDICCION line_vs_set + "No entiendo"', async p => {
  await p.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
  await p.evaluate(()=>window.__tutoria.media.play()); await esperaQ(p);
});
await probar('CHECKPOINT cp1 + "No entiendo"', async p => {
  await p.evaluate(()=>window.__tutoria.media.seek(143)); await new Promise(r=>setTimeout(r,300));
  await p.evaluate(()=>window.__tutoria.media.play()); await esperaQ(p);
});
await probar('SIN pregunta (t=60, pausado) + "No entiendo"', async p => {
  await p.evaluate(()=>window.__tutoria.media.seek(60)); await new Promise(r=>setTimeout(r,300));
  await p.evaluate(()=>document.querySelector('#ask')?.click());
  await new Promise(r=>setTimeout(r,500));
});
