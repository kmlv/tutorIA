import {abrir} from './_lib.mjs';
const {browser, page} = await abrir();
const lee = () => page.evaluate(()=>{
  const t=[...document.querySelectorAll('.capa-interceptos text')].map(e=>e.textContent);
  return {intercep:t, aria:document.querySelector('.lienzo svg')?.getAttribute('aria-label'),
    tir:[...document.querySelectorAll('.capa-manip circle.tirador')].map(e=>({cx:+e.getAttribute('cx'),cy:+e.getAttribute('cy')}))};
});
const svg2page = (x,y) => page.evaluate(([x,y])=>{
  const svg=document.querySelector('.lienzo svg');
  const p=svg.createSVGPoint(); p.x=x; p.y=y;
  const q=p.matrixTransform(svg.getScreenCTM()); return {x:q.x,y:q.y};
},[x,y]);
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela'}).click();
await page.waitForTimeout(3000);
console.log('antes', JSON.stringify(await lee()));
// arrastrar tirador Y (index 1) hacia arriba
const t = (await lee()).tir[1];
const from = await svg2page(t.cx, t.cy);
const to = await svg2page(t.cx, 100);
await page.mouse.move(from.x, from.y);
await page.mouse.down();
for (let k=1;k<=12;k++) { await page.mouse.move(from.x+(to.x-from.x)*k/12, from.y+(to.y-from.y)*k/12); await page.waitForTimeout(20); }
await page.mouse.up();
await page.waitForTimeout(400);
console.log('despues', JSON.stringify(await lee()));
await browser.close();
