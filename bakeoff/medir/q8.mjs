import {abrir, snapFn} from './lib.mjs';
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
for (const ts of [174.5,175.0,175.5,175.9,174.5,170,172]){
  // reset: recargar estado saltando a 0 y limpiando
  await page.evaluate(()=>{window.__tutoria.media.pause(); window.__tutoria.media.seek(0);});
  await new Promise(r=>setTimeout(r,400));
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,300));
  const pre = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), q:!!document.querySelector('.q')}));
  await page.evaluate(()=>window.__tutoria.media.play());
  let apareció=false, tq=null;
  for(let i=0;i<24;i++){
    await new Promise(r=>setTimeout(r,250));
    const r = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), q:!!document.querySelector('.q'), paused:window.__tutoria.media.paused()}));
    if(r.q){apareció=true; tq=r.t; break;}
    if(r.t>179) break;
  }
  console.log(`seek(${ts}) real=${pre.t} -> pregunta ${apareció?'SI en t='+tq:'NO'}`);
  await page.evaluate(()=>{window.__tutoria.media.pause();});
  // limpiar la pregunta si apareció
  if (apareció) { const b= await page.$('.q-opciones button:nth-child(1)'); if(b) await b.click(); await new Promise(r=>setTimeout(r,300)); await page.evaluate(()=>window.__tutoria.media.pause()); }
}
await browser.close();
