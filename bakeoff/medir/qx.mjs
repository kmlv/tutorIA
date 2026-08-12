import {abrir, snapFn} from './lib.mjs';
async function esperaQ(page,l=40000){const t0=Date.now();while(Date.now()-t0<l){if(await page.evaluate(()=>!!document.querySelector('.q')))return true;await new Promise(r=>setTimeout(r,150));}return false;}
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
page.on('response', async r=>{ if(/\/chat/.test(r.url())) console.log('   CHAT', r.status(), (await r.text().catch(()=>'')).slice(0,180)); });
await page.evaluate(()=>window.__tutoria.media.seek(60)); await new Promise(r=>setTimeout(r,300));
await page.click('#ask'); await new Promise(r=>setTimeout(r,400));
const enviar = async (txt) => {
  const antes = await page.evaluate(()=>document.querySelector('.dock-body').innerText.length);
  await page.evaluate((t)=>{ const i=document.querySelector('.composer-input'); i.value=t; i.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('.composer').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); }, txt);
  const t0=Date.now(); while(Date.now()-t0<20000){ const n=await page.evaluate(()=>document.querySelector('.dock-body').innerText.length); if(n>antes+30) break; await new Promise(r=>setTimeout(r,300)); }
};
for(let i=1;i<=12;i++) await enviar('duda '+i+' sobre la recta');
let st = await page.evaluate(()=>({rest:document.querySelector('.composer-restantes')?.innerText, dis:document.querySelector('.composer-input')?.disabled, btn:document.querySelector('.composer-enviar')?.disabled, ph:document.querySelector('.composer-input')?.placeholder}));
console.log('CUPO 0:', JSON.stringify(st));
await enviar('numero 13, ya sin cupo');
console.log('tras 13:', (await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '))).slice(-220));
st = await page.evaluate(()=>({rest:document.querySelector('.composer-restantes')?.innerText, dis:document.querySelector('.composer-input')?.disabled, btn:document.querySelector('.composer-enviar')?.disabled, ph:document.querySelector('.composer-input')?.placeholder}));
console.log('estado composer:', JSON.stringify(st));
// prediccion
await page.evaluate(()=>window.__tutoria.media.seek(85)); await new Promise(r=>setTimeout(r,400));
await page.evaluate(()=>window.__tutoria.media.play()); await esperaQ(page); await new Promise(r=>setTimeout(r,600));
st = await page.evaluate(()=>({q:!!document.querySelector('.q'), rest:document.querySelector('.composer-restantes')?.innerText, dis:document.querySelector('.composer-input')?.disabled, btn:document.querySelector('.composer-enviar')?.disabled}));
console.log('EN LA PREDICCION sin cupo:', JSON.stringify(st));
await page.evaluate(()=>{[...document.querySelectorAll('.intencion')].find(b=>b.innerText.trim()==='No entiendo')?.click();});
await new Promise(r=>setTimeout(r,3000));
console.log('tras "No entiendo":', (await page.evaluate(()=>document.querySelector('.dock-body').innerText.replace(/\n+/g,' | '))).slice(-160));
await page.screenshot({path:'sh-cupo0-pred.png'});
await browser.close();
