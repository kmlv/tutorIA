import {abrir, snapFn} from './lib.mjs';
// 1) responder INSTANTANEAMENTE (polling a 20ms, click en cuanto exista)
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  const r = await page.evaluate(async ()=>{
    return await new Promise(res=>{
      const iv = setInterval(()=>{
        const b = document.querySelector('.q-opciones button');
        if(b){ clearInterval(iv); const t0 = window.__tutoria.media.currentTime(); b.click();
               setTimeout(()=>res({tClick:t0, tDespues:window.__tutoria.media.currentTime(), paused:window.__tutoria.media.paused(),
                 opc:[...document.querySelectorAll('.q-opciones button')].map(x=>x.className+(x.disabled?'/D':''))}), 800); }
      }, 20);
    });
  });
  console.log('RAPIDO:', JSON.stringify(r));
  await browser.close();
}
// 2) dos clicks en opciones distintas casi simultáneos
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  page.on('request', q=>{ if(/api/.test(q.url())) console.log('   REQ', (q.postData()||'').slice(0,140)); });
  await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  const t0=Date.now(); while(Date.now()-t0<30000){ if(await page.evaluate(()=>!!document.querySelector('.q'))) break; await new Promise(r=>setTimeout(r,150)); }
  await new Promise(r=>setTimeout(r,300));
  const r2 = await page.evaluate(()=>{
    const bs=[...document.querySelectorAll('.q-opciones button')];
    bs[1].click(); bs[2].click(); bs[0].click();
    return bs.map(x=>x.className+(x.disabled?'/D':''));
  });
  await new Promise(r=>setTimeout(r,1200));
  const s = await page.evaluate(snapFn);
  console.log('TRIPLE CLICK:', JSON.stringify(r2), '-> final', JSON.stringify(s.q.opciones.map(o=>o.cls)), 't=',s.t,'paused=',s.paused);
  await browser.close();
}
