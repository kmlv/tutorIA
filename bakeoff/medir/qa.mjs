import {abrir} from './lib.mjs';
const tests = [[176.128,[150,155,160,165,168,169,170,170.5,171,171.5,172]]];
for (const [tp, seeks] of tests){
  for (const ts of seeks){
    const {browser,page} = await abrir('http://localhost:57330/?lang=es');
    await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
    await new Promise(r=>setTimeout(r,300));
    const pre = await page.evaluate(()=>+window.__tutoria.media.currentTime().toFixed(2));
    await page.evaluate(()=>window.__tutoria.media.play());
    let ok=false,tq=null;
    for(let i=0;i<60;i++){
      await new Promise(r=>setTimeout(r,200));
      const r = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), q:!!document.querySelector('.q')}));
      if(r.q){ok=true;tq=r.t;break;}
      if(r.t>tp+4) break;
    }
    console.log(`seek(${ts}) real=${pre} -> ${ok?'PREGUNTA t='+tq:'*** SE LA SALTÓ ***'}`);
    await browser.close();
  }
}
