import {abrir, snapFn} from './lib.mjs';
async function llegar(page, ts){
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,200));
  await page.evaluate(()=>window.__tutoria.media.play());
  await page.waitForFunction('document.querySelector(".q")', null, {timeout:25000});
  await new Promise(r=>setTimeout(r,600));
}
// C) dar a "Seguir" (#play) sin responder, en price_effect
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await llegar(page, 174.5);
let s = await page.evaluate(snapFn);
console.log('C) pregunta en pantalla t=',s.t,'paused=',s.paused, '| btn#play =', await page.$eval('#play', b=>b.innerText+' disabled='+b.disabled));
await page.click('#play');
for(const ms of [500,1500,2500,4000]){
  await new Promise(r=>setTimeout(r,ms));
  const x = await page.evaluate(snapFn);
  console.log('  +'+ms,'t=',x.t,'paused=',x.paused,'qVisible=',!!x.q, 'opc=', x.q? x.q.opciones.map(o=>o.cls+(o.dis?'/DIS':'')).join(',') : '-', '| cap=', x.captions.split(' | ')[0].slice(0,80));
}
await page.screenshot({path:'sh-C-play-sin-responder.png'});
// ahora intento responder DESPUES de haber oido la revelacion
const still = await page.$('.q-opciones button:nth-child(1)');
console.log('C) sigue clicable?', still ? await still.evaluate(b=>!b.disabled) : 'no existe');
if (still) { await page.click('.q-opciones button:nth-child(1)'); await new Promise(r=>setTimeout(r,1200));
  const x = await page.evaluate(snapFn); console.log('  tras responder tarde:', 't=',x.t,'paused=',x.paused,'dock=',x.dockEstado, 'opc=', x.q?x.q.opciones.map(o=>o.cls).join(','):'-'); }
await browser.close();
