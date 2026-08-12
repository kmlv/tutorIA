import {abrir} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await page.evaluate(()=>window.__tutoria.media.seek(174.5)); await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,400));
await page.screenshot({path:'sh-pe-ANTES.png'});
console.log('antes', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())));
await page.click('.q-opciones button:nth-child(1)');
await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.pause());
await page.screenshot({path:'sh-pe-DESPUES-0.3s.png'});
await new Promise(r=>setTimeout(r,2000));
await page.screenshot({path:'sh-pe-DESPUES-2s.png'});
console.log('despues', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())));
await browser.close();
