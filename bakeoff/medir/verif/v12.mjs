import {abrir} from './_lib.mjs';
import {dragTo} from './drv.mjs';
const {browser, page} = await abrir();
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela'}).click();
await page.waitForTimeout(3000);
await dragTo(page,1,62,56.625);
await dragTo(page,0,502.6,396);
await page.locator('.q-manip button.primario').last().click();
await page.waitForTimeout(3500);
await page.locator('.q-numeric .q-input').last().fill('150');
await page.locator('.q-numeric button[type=submit]').last().click();
await page.waitForTimeout(3500);
await page.getByRole('button', {name:'Pivota: el intercepto del jugo no se mueve y la recta se empina'}).click();
await page.waitForTimeout(6000);
const med = ()=>page.evaluate(()=>{
  const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return{top:Math.round(b.top),bottom:Math.round(b.bottom),h:Math.round(b.height)}};
  const ultQ=[...document.querySelectorAll('.q')].at(-1);
  const l=document.querySelector('.lienzo'); const lb=r(l);
  const vis=Math.max(0,Math.min(lb.bottom,innerHeight)-Math.max(lb.top,0));
  return {scrollY:Math.round(scrollY), docH:document.documentElement.scrollHeight, innerH:innerHeight,
    lienzo:lb, lienzoVisiblePx:Math.round(vis), pctOculto:Math.round(100*(1-vis/lb.h)),
    play:r(document.getElementById('play')),
    ultQ:r(ultQ), enun:ultQ.querySelector('.q-enunciado')?.textContent,
    listo:r(ultQ.querySelector('button.primario')),
    tiradores:[...document.querySelectorAll('.capa-manip circle.tirador')].map(e=>{const b=e.getBoundingClientRect();return{top:Math.round(b.top),dentro:b.top>=0&&b.bottom<=innerHeight}}),
    maxScroll: document.documentElement.scrollHeight-innerHeight};
});
console.log('AL APARECER EL ITEM 5:', JSON.stringify(await med(),null,1));
await page.screenshot({path:'verif/i5-confirmado.png'});
// puede el alumno recuperarse subiendo?
await page.evaluate(()=>scrollTo(0,0));
await page.waitForTimeout(500);
const arriba = await med();
console.log('TRAS SUBIR A scrollY=0:', JSON.stringify({lienzo:arriba.lienzo, ultQ:arriba.ultQ, listo:arriba.listo, tiradores:arriba.tiradores},null,1));
await page.screenshot({path:'verif/i5-tras-subir.png'});
await browser.close();
