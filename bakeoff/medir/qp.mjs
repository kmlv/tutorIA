import {abrir} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
for (const [ts,label,opts] of [[85,'line_vs_set',[1,2,3]],[122,'slope_sign',[1,2,3]],[174.5,'price_effect',[1,2,3]]]){
  for (const opt of opts){
    const {browser,page} = await abrir('http://localhost:57330/?lang=es');
    let resp=null, dockAfter=null;
    page.on('response', async r => { if(/\/answer/.test(r.url())) resp = (await r.text().catch(()=>'')).slice(0,400); });
    await page.evaluate((t)=>window.__tutoria.media.seek(t), ts); await new Promise(r=>setTimeout(r,300));
    await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,400));
    await page.click(`.q-opciones button:nth-child(${opt})`);
    await new Promise(r=>setTimeout(r,2500));
    dockAfter = await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '));
    const paused = await page.evaluate(()=>window.__tutoria.media.paused());
    console.log(`\n${label} opcion${opt}  paused=${paused}`);
    console.log('  SERVIDOR:', resp);
    console.log('  PANTALLA (dock-body tail):', dockAfter.slice(-140));
    await browser.close();
  }
}
