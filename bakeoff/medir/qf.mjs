import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await page.evaluate(()=>window.__tutoria.media.seek(85));
await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play());
await esperaQ(page);
const dockHtml = await page.evaluate(()=>document.querySelector('.dock').innerHTML);
console.log(dockHtml.slice(0,3000));
await browser.close();
