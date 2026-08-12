import {abrir, snapFn} from './lib.mjs';
async function llegar(page, ts){
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,200));
  await page.evaluate(()=>window.__tutoria.media.play());
  await page.waitForFunction('document.querySelector(".q")', null, {timeout:25000});
  await new Promise(r=>setTimeout(r,600));
}
for (const [ts,id,opt] of [[122,'slope_sign',2],[122,'slope_sign',3],[174.5,'price_effect',2],[174.5,'price_effect',3]]){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await llegar(page, ts);
  const s0 = await page.evaluate(snapFn);
  await page.click(`.q-opciones button:nth-child(${opt})`);
  await new Promise(r=>setTimeout(r,2500));
  const s = await page.evaluate(snapFn);
  console.log(`${id} opcion${opt} "${s0.q.opciones[opt-1].t}" -> t=${s.t} paused=${s.paused} dock=${s.dockEstado} dockText=${(s.dockText||'').slice(0,220)}`);
  await browser.close();
}
