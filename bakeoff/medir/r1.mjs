import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page);
console.log('prediccion en pantalla, recargo');
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await new Promise(r=>setTimeout(r,900));
const x = await page.evaluate(snapFn);
console.log('tras recarga: t=',x.t,'paused=',x.paused,'q?',!!x.q,'mostrar=',JSON.stringify(x.estado.mostrar));
await browser.close();
