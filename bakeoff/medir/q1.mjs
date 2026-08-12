import {abrir, snapFn} from './lib.mjs';
async function llegar(page, ts){
  await page.evaluate((t)=>{window.__tutoria.media.seek(t);}, ts);
  await new Promise(r=>setTimeout(r,200));
  await page.evaluate(()=>window.__tutoria.media.play());
  await page.waitForFunction('document.querySelector(".q")', null, {timeout:20000});
  await new Promise(r=>setTimeout(r,500));
}
const brief = s => ({t:s.t, paused:s.paused, q: s.q? s.q.opciones.map(o=>o.t.slice(0,28)+'['+o.cls+(o.dis?' DIS':'')+']') : null, qtext: s.q?s.q.text.slice(0,90):null, dock:s.dockEstado, cap:s.captions.split(' | ')[0].slice(0,90)});

// A) responder CORRECTO en pred 1
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es');
  await llegar(page, 85);
  console.log('A) antes:', JSON.stringify(brief(await page.evaluate(snapFn))));
  await page.click('.q-opciones button:nth-child(1)');
  for(const ms of [300,1000,2000,3000]){
    await new Promise(r=>setTimeout(r,ms));
    console.log('A) +'+ms, JSON.stringify(brief(await page.evaluate(snapFn))));
  }
  const dockFull = await page.evaluate(()=>document.querySelector('.dock').innerText.replace(/\n+/g,' | '));
  console.log('A) DOCK:', dockFull.slice(0,600));
  await page.screenshot({path:'sh-A-correcto.png'});
  await browser.close();
}
