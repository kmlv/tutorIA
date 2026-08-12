import {abrir} from './_lib.mjs';
import {snap, dragTo, ultimoHTML} from './drv.mjs';
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
await snap(page,'I4');
await page.getByRole('button', {name:'Pivota: el intercepto del jugo no se mueve y la recta se empina'}).click();
await page.waitForTimeout(4000);
await snap(page,'I5');
console.log('HTML I5:', await ultimoHTML(page));
// detalle de visibilidad
const det = await page.evaluate(()=>{
  const r=e=>{const b=e.getBoundingClientRect();return{top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right),h:Math.round(b.height)}};
  const l=document.querySelector('.lienzo'), lb=r(l);
  const visible = Math.max(0, Math.min(lb.bottom, innerHeight) - Math.max(lb.top,0));
  return {lienzo:lb, visiblePx:Math.round(visible), pctFuera: Math.round(100*(1-visible/lb.h)),
    play:r(document.querySelector('#play')), scrollY:Math.round(scrollY), docH:document.documentElement.scrollHeight,
    tiradoresEnPantalla: [...document.querySelectorAll('.capa-manip circle.tirador')].map(e=>{const b=e.getBoundingClientRect();return {top:Math.round(b.top), dentro: b.top>=0&&b.bottom<=innerHeight};}),
    nota: [...document.querySelectorAll('.q-nota')].at(-1)?.textContent};
});
console.log('DETALLE:', JSON.stringify(det,null,1));
await page.screenshot({path:'verif/i5-1280x860.png'});
await browser.close();
