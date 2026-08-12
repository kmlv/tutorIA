import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,200));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
const posts=[]; page.on('request', q=>{ if(/api/.test(q.url())) posts.push((q.postData()||'').slice(0,180)); });
await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,400));
await page.click('.q-opciones button:nth-child(1)');   // correcta
await new Promise(r=>setTimeout(r,1500));
let est = await page.evaluate(()=>[...document.querySelectorAll('.q-opciones button')].map(b=>b.className+'|dis='+b.disabled));
console.log('tras responder (1.5s):', JSON.stringify(est));
await new Promise(r=>setTimeout(r,4000));
est = await page.evaluate(()=>[...document.querySelectorAll('.q-opciones button')].map(b=>b.className+'|dis='+b.disabled));
console.log('tras 5.5s:', JSON.stringify(est));
// intentar responder OTRA VEZ (el dock está oculto; forzamos click programático como haría un lector de pantalla / tab)
const n0 = posts.length;
await page.evaluate(()=>document.querySelectorAll('.q-opciones button')[2].click());
await new Promise(r=>setTimeout(r,1200));
console.log('nuevos POST tras segundo click:', posts.slice(n0));
console.log('--- todos los POST ---'); posts.forEach(p=>console.log('  ',p));
await browser.close();
