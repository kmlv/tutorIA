import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
await page.evaluate(()=>window.__tutoria.media.seek(174.5)); await new Promise(r=>setTimeout(r,300));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,400));
await page.click('summary');
await new Promise(r=>setTimeout(r,600));
const txt = await page.evaluate(()=>{
  const d = document.querySelector('details');
  return {abierto:d.open, len:d.innerText.length, muestra: d.innerText.replace(/\n+/g,' | ').slice(0,120), contieneRevelacion: d.innerText.includes('no se desplaza: gira'), contieneTodo: d.innerText.includes('El intercepto del jugo se queda clavado')};
});
console.log(JSON.stringify(txt));
// tambien probar ocultar subtitulos y volver a la prediccion 1
await page.screenshot({path:'sh-transcripcion.png'});
await browser.close();
// captions ocultos
const b2 = await abrir('http://localhost:57330/?lang=es');
await b2.page.click('.caption-toggle');
await b2.page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,300));
await b2.page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(b2.page); await new Promise(r=>setTimeout(r,400));
const cap = await b2.page.evaluate(()=>{const c=document.querySelector('.captions-band'); return c? {txt:c.innerText.split('\n')[0], h:Math.round(c.getBoundingClientRect().height)}:null;});
console.log('con subtítulos ocultos:', JSON.stringify(cap));
await b2.browser.close();
