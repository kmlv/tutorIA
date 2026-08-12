import {abrir} from './_lib.mjs';
import {snap, dragTo} from './drv.mjs';
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
console.log('--- pulso opcion 4 ---');
await page.getByRole('button', {name:'Pivota: el intercepto del jugo no se mueve y la recta se empina'}).click();
for (let k=0;k<16;k++){
  await page.waitForTimeout(500);
  const s = await page.evaluate(()=>{const b=document.querySelector('.lienzo').getBoundingClientRect();
    return {ms:0, y:Math.round(scrollY), lt:Math.round(b.top), lb:Math.round(b.bottom), docH:document.documentElement.scrollHeight,
      nQ:document.querySelectorAll('.q').length, ult:[...document.querySelectorAll('.q-enunciado')].at(-1)?.textContent?.slice(0,50)};});
  console.log(`t+${(k+1)*500}ms`, JSON.stringify(s));
}
await page.screenshot({path:'verif/i5-settled.png'});
// intento de arrastre SIN scrollear manualmente (lo que haria el alumno mirando la pantalla)
const puedeVer = await page.evaluate(()=>{
  const b=document.querySelector('.lienzo').getBoundingClientRect();
  return {visible: Math.max(0, Math.min(b.bottom, innerHeight)-Math.max(b.top,0)), alto: Math.round(b.height)};
});
console.log('VISIBLE DEL LIENZO:', JSON.stringify(puedeVer));
// que se ve realmente en la mitad izquierda
const arriba = await page.evaluate(()=>{
  const els=[...document.elementsFromPoint(430, 300)].map(e=>e.className?.baseVal ?? e.className).slice(0,4);
  return els;
});
console.log('elementos en (430,300):', JSON.stringify(arriba));
await browser.close();
