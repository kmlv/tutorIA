import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
// A) esperar 60s con la prediccion en pantalla y luego responder
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  let resp=null; page.on('response', async r=>{ if(/\/answer/.test(r.url())) resp=(await r.text().catch(()=>'')).slice(0,200); });
  await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page);
  console.log('A) espero 60s...');
  await new Promise(r=>setTimeout(r,60000));
  const x0 = await page.evaluate(snapFn);
  console.log('A) tras 60s: t=',x0.t,'paused=',x0.paused,'q?',!!x0.q,'dock=',x0.dockEstado);
  await page.click('.q-opciones button:nth-child(1)');
  await new Promise(r=>setTimeout(r,2000));
  const x = await page.evaluate(snapFn);
  console.log('A) tras responder: t=',x.t,'paused=',x.paused,'servidor=',resp);
  await browser.close();
}
// B) recargar con la prediccion en pantalla
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page);
  console.log('B) prediccion en pantalla. Recargo (F5).');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await new Promise(r=>setTimeout(r,800));
  const x = await page.evaluate(snapFn);
  console.log('B) tras recarga: t=',x.t,'paused=',x.paused,'q?',!!x.q,'estado=',JSON.stringify(x.estado.mostrar));
  await browser.close();
}
