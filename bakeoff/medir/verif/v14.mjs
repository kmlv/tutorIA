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
const m = ()=>page.evaluate(()=>{const db=document.querySelector('.dock-body');
  const l=document.querySelector('.lienzo').getBoundingClientRect();
  const app=document.getElementById('app');
  return {docH:document.documentElement.scrollHeight, scrollY:Math.round(scrollY),
    appH:Math.round(app.getBoundingClientRect().height),
    cssMinH:getComputedStyle(app).minHeight, cssH:getComputedStyle(app).height,
    dockBody:{sT:db.scrollTop,sH:db.scrollHeight,cH:db.clientHeight, scrollable: db.scrollHeight>db.clientHeight},
    lienzo:{top:Math.round(l.top),bottom:Math.round(l.bottom)}};});
console.log('ANTES:', JSON.stringify(await m()));
await page.addStyleTag({content:'#app{height:100vh; min-height:100vh;}'});
await page.evaluate(()=>{const db=document.querySelector('.dock-body'); db.scrollTop=db.scrollHeight;});
await page.waitForTimeout(600);
console.log('CON #app{height:100vh}:', JSON.stringify(await m()));
await page.screenshot({path:'verif/i5-con-fix-tentativo.png'});
await browser.close();
