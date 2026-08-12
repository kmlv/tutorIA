import {abrir} from './_lib.mjs';
const {browser, page} = await abrir();
const snap = async (etiqueta) => {
  const info = await page.evaluate(() => {
    const q = document.querySelector('.q');
    const l = document.querySelector('.lienzo');
    const p = document.querySelector('#play');
    const r = e => { if(!e) return null; const b=e.getBoundingClientRect(); return {top:Math.round(b.top),bottom:Math.round(b.bottom),h:Math.round(b.height)}; };
    return {
      scrollY: Math.round(window.scrollY),
      docH: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      cls: q?.className,
      enun: document.querySelector('.q-enunciado')?.textContent,
      lienzo: r(l), play: r(p),
      nQ: document.querySelectorAll('.q').length,
    };
  });
  console.log(etiqueta, JSON.stringify(info));
};
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
await snap('item1');
// responder item 1
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela'}).click();
await page.waitForTimeout(3000);
await snap('tras1');
const manipHTML = await page.evaluate(()=> document.querySelector('.q-manip')?.outerHTML.slice(0,2000) || 'sin manip');
console.log('MANIP:', manipHTML);
const enun2 = await page.evaluate(()=> [...document.querySelectorAll('.q-enunciado')].map(e=>e.textContent));
console.log('ENUNS:', JSON.stringify(enun2));
await browser.close();
