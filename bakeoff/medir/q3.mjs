import {abrir, snapFn} from './lib.mjs';
async function llegar(page, ts){
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,200));
  await page.evaluate(()=>window.__tutoria.media.play());
  await page.waitForFunction('document.querySelector(".q")', null, {timeout:25000});
  await new Promise(r=>setTimeout(r,600));
}
// checkpoint cp1 @144.761 : respuesta incorrecta
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await llegar(page, 143);
let s = await page.evaluate(snapFn);
console.log('CP1 pregunta:', s.q.text);
console.log('CP1 caption al aparecer:', s.captions.split(' | ')[0]);
console.log('CP1 t=', s.t, 'paused=', s.paused);
await page.click('.q-opciones button:nth-child(2)');
for(const ms of [500,1500,3000]){
  await new Promise(r=>setTimeout(r,ms));
  const x = await page.evaluate(snapFn);
  console.log('  +'+ms, 't=',x.t,'paused=',x.paused,'dock=',x.dockEstado);
  console.log('     dockText:', x.dockText);
}
await page.screenshot({path:'sh-cp1-mal.png'});
await browser.close();
