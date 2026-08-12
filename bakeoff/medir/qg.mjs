import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
for (const chip of ['No entiendo','Otro ejemplo','Más despacio','¿Por qué?','Listo, sigamos']){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>window.__tutoria.media.seek(85));
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  await esperaQ(page);
  console.log('\n### chip:', chip);
  await page.evaluate((c)=>{ [...document.querySelectorAll('.intencion')].find(b=>b.innerText.trim()===c).click(); }, chip);
  for (const ms of [800, 2500, 4000]){
    await new Promise(r=>setTimeout(r,ms));
    const x = await page.evaluate(snapFn);
    const body = await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '));
    console.log('  +'+ms,'t=',x.t,'paused=',x.paused,'dock=',x.dockEstado);
    console.log('    body:', body.slice(0,400));
  }
  await page.screenshot({path:`sh-chip-${chip.replace(/[^a-zA-Z]/g,'')}.png`});
  await browser.close();
}
