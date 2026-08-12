import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
// A) recorrido continuo real desde 150
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>window.__tutoria.media.seek(152)); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play());
  await esperaQ(page); await new Promise(r=>setTimeout(r,300));
  const e = await page.evaluate(()=>window.__tutoria.estado());
  const bands = await page.evaluate(()=>document.querySelector('.bands')?.innerText.replace(/\n+/g,' | ') ?? document.querySelector('.escenario')?.innerText.replace(/\n+/g,' | '));
  console.log('CONTINUO -> estado en la prediccion:', JSON.stringify(e));
  console.log('CONTINUO -> banda:', bands);
  await browser.close();
}
// B) teclado: barra espaciadora con la pregunta en pantalla
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>document.body.focus());
  await page.keyboard.press('Space');
  await new Promise(r=>setTimeout(r,1500));
  let x = await page.evaluate(snapFn);
  console.log('ESPACIO en body -> t=',x.t,'paused=',x.paused);
  await browser.close();
}
// C) foco/tab: ¿se puede llegar a las opciones con Tab desde el principio?
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,400));
  const foco0 = await page.evaluate(()=>document.activeElement.tagName+':'+(document.activeElement.innerText||'').slice(0,30));
  const seq=[];
  for(let i=0;i<10;i++){ await page.keyboard.press('Tab'); seq.push(await page.evaluate(()=>document.activeElement.tagName+':'+(document.activeElement.className||'')+':'+(document.activeElement.innerText||'').slice(0,26))); }
  console.log('foco al aparecer:', foco0);
  console.log('TAB x10:', JSON.stringify(seq,null,0));
  await browser.close();
}
