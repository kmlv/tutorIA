import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page, limite=40000){
  const t0=Date.now();
  while(Date.now()-t0<limite){
    if(await page.evaluate(()=>!!document.querySelector('.q'))) return true;
    await new Promise(r=>setTimeout(r,200));
  }
  return false;
}
// sanity: seek(150) con espera generosa
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>window.__tutoria.media.seek(150));
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  const ok = await esperaQ(page, 40000);
  const x = await page.evaluate(snapFn);
  console.log('SANITY seek(150) -> pregunta?', ok, 't=',x.t);
  await browser.close();
}
// 2) responder pred1, rebobinar a 85, reproducir de nuevo
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>window.__tutoria.media.seek(85));
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  await esperaQ(page);
  await page.click('.q-opciones button:nth-child(1)');
  await new Promise(r=>setTimeout(r,1200));
  console.log('R) respondida. Ahora rebobino a 85.');
  await page.evaluate(()=>{window.__tutoria.media.pause(); window.__tutoria.media.seek(85);});
  await new Promise(r=>setTimeout(r,600));
  let x = await page.evaluate(snapFn);
  console.log('R) tras seek(85): t=',x.t,'q presente?',!!x.q, 'opc=', x.q? x.q.opciones.map(o=>o.cls+(o.dis?'/DIS':'')).join(',') : '-','dock=',x.dockEstado);
  await page.evaluate(()=>window.__tutoria.media.play());
  const ok2 = await esperaQ(page, 8000);
  await new Promise(r=>setTimeout(r,1200));
  x = await page.evaluate(snapFn);
  console.log('R) tras reproducir: t=',x.t,'paused=',x.paused,'q presente?',!!x.q,'opc=', x.q? x.q.opciones.map(o=>o.cls+(o.dis?'/DIS':'')).join(',') : '-');
  await page.screenshot({path:'sh-R-rebobinado.png'});
  await browser.close();
}
