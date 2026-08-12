import {abrir, snapFn} from './lib.mjs';
async function llegar(page, ts){
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,200));
  await page.evaluate(()=>window.__tutoria.media.play());
  await page.waitForFunction('document.querySelector(".q")', null, {timeout:25000});
  await new Promise(r=>setTimeout(r,600));
}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await llegar(page, 174.5);   // price_effect
console.log('D) pregunta arriba t=', (await page.evaluate(snapFn)).t);
await page.evaluate(()=>window.__tutoria.media.seek(40));
await new Promise(r=>setTimeout(r,800));
let x = await page.evaluate(snapFn);
console.log('D) tras seek(40): t=',x.t,'q sigue?',!!x.q, '| qtext=', x.q? x.q.text.slice(0,80):'-', '| cap=', x.captions.split(' | ')[0].slice(0,70));
console.log('   estado=', JSON.stringify(x.estado.mostrar), 'p1=',x.estado.p1);
await page.screenshot({path:'sh-D-seek40-con-pregunta.png'});
// y si respondo ahora, a 40s?
await page.click('.q-opciones button:nth-child(1)');
await new Promise(r=>setTimeout(r,1500));
x = await page.evaluate(snapFn);
console.log('D) tras responder en t=40: t=',x.t,'paused=',x.paused,'dock=',x.dockEstado);
await browser.close();
