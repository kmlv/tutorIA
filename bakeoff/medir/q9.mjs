import {abrir} from './lib.mjs';
for (const ts of [170,172,174,174.5,175,175.5,175.9,176.0,176.05]){
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  let ok=false, tq=null;
  for(let i=0;i<30;i++){
    await new Promise(r=>setTimeout(r,200));
    const r = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), q:!!document.querySelector('.q')}));
    if(r.q){ok=true;tq=r.t;break;}
    if(r.t>180) break;
  }
  console.log(`seek(${ts}) -> pregunta ${ok?'SI t='+tq:'NO (llegó a >180 sin preguntar)'}`);
  await browser.close();
}
