import {abrir} from './_lib.mjs';
import {dragTo} from './drv.mjs';
const {browser, page} = await abrir();
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela'}).click();
await page.waitForTimeout(3000);
await dragTo(page,1,62,56.625); await dragTo(page,0,502.6,396);
await page.locator('.q-manip button.primario').last().click();
await page.waitForTimeout(3500);
await page.locator('.q-numeric .q-input').last().fill('150');
await page.locator('.q-numeric button[type=submit]').last().click();
await page.waitForTimeout(3500);
await page.getByRole('button', {name:'Pivota: el intercepto del jugo no se mueve y la recta se empina'}).click();
await page.waitForTimeout(6000);
// barrido de posiciones de scroll: ¿existe alguna con tirador Y boton Listo a la vez?
const res = [];
for (let y=0; y<=961; y+=40) {
  await page.evaluate(v=>scrollTo(0,v), y);
  await page.waitForTimeout(120);
  const r = await page.evaluate(()=>{
    const vis = e => { if(!e) return false; const b=e.getBoundingClientRect(); return b.top>=0 && b.bottom<=innerHeight; };
    const ult=[...document.querySelectorAll('.q')].at(-1);
    const tir=[...document.querySelectorAll('.capa-manip circle.tirador')];
    return {y:Math.round(scrollY), tirX:vis(tir[0]), tirY:vis(tir[1]), listo:vis(ult.querySelector('button.primario')), enun:vis(ult.querySelector('.q-enunciado'))};
  });
  res.push(r);
}
const ambos = res.filter(r=>(r.tirX||r.tirY) && r.listo);
console.log('posiciones con algun tirador Y el boton Listo visibles:', JSON.stringify(ambos));
const conListo = res.filter(r=>r.listo).map(r=>r.y);
const conTir = res.filter(r=>r.tirX&&r.tirY).map(r=>r.y);
console.log('scrollY con Listo visible:', conListo[0], '..', conListo.at(-1));
console.log('scrollY con ambos tiradores visibles:', conTir[0], '..', conTir.at(-1));
await browser.close();
