import {abrir} from './_lib.mjs';
const {browser, page} = await abrir();
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela'}).click();
await page.waitForTimeout(2500);
console.log('ESTADO:', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())));
console.log('DOCK:', JSON.stringify(await page.evaluate(()=>window.__tutoria.dock?.actual)).slice(0,400));
console.log('KEYS tutoria:', await page.evaluate(()=>Object.keys(window.__tutoria)));
// geometry of svg / handles
const g = await page.evaluate(()=>{
  const svg = document.querySelector('.lienzo svg') || document.querySelector('.lienzo');
  const handles = [...document.querySelectorAll('.lienzo [class*=tir], .lienzo circle, .lienzo [data-tirador]')].map(e=>({c:e.getAttribute('class'),cx:e.getAttribute('cx'),cy:e.getAttribute('cy')}));
  return {svgHTML: svg? svg.outerHTML.slice(0,1500):null, handles};
});
console.log(JSON.stringify(g,null,1).slice(0,2500));
await browser.close();
