import {abrir, snapFn} from './lib.mjs';
async function llegar(page, ts){
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,200));
  await page.evaluate(()=>window.__tutoria.media.play());
  await page.waitForFunction('document.querySelector(".q")', null, {timeout:20000});
  await new Promise(r=>setTimeout(r,500));
}
const brief = s => ({t:s.t, paused:s.paused, opc: s.q? s.q.opciones.map(o=>o.cls+(o.dis?'/DIS':'')) : null, dock:s.dockEstado, cap:s.captions.split(' | ')[0].slice(0,70)});
for (const idx of [2,3]){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await llegar(page, 85);
  console.log('\nB'+idx+') click opcion', idx);
  await page.click(`.q-opciones button:nth-child(${idx})`);
  for(const ms of [400,1500,3000,5000]){
    await new Promise(r=>setTimeout(r,ms));
    console.log('  +'+ms, JSON.stringify(brief(await page.evaluate(snapFn))));
  }
  const dockFull = await page.evaluate(()=>document.querySelector('.dock').innerText.replace(/\n+/g,' | '));
  console.log('  DOCK:', dockFull.slice(0,800));
  await page.screenshot({path:`sh-B${idx}.png`});
  await browser.close();
}
