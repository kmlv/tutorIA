import {abrir} from './_lib.mjs';
const {browser, page} = await abrir();

const snap = async (t) => {
  const i = await page.evaluate(() => {
    const r = e => { if(!e) return null; const b=e.getBoundingClientRect(); return {top:Math.round(b.top),bottom:Math.round(b.bottom)}; };
    const qs=[...document.querySelectorAll('.q')];
    return {scrollY:Math.round(scrollY), docH:document.documentElement.scrollHeight, bodyH:document.body.scrollHeight,
      innerH:innerHeight, nQ:qs.length, ultimo:qs.at(-1)?.className,
      enun:qs.at(-1)?.querySelector('.q-enunciado')?.textContent,
      lienzo:r(document.querySelector('.lienzo')), play:r(document.querySelector('#play')),
      dockScroll: (()=>{const d=document.querySelector('.dock'); return d?{sT:Math.round(d.scrollTop),sH:d.scrollHeight,cH:d.clientHeight}:null})()};
  });
  console.log(t, JSON.stringify(i));
  return i;
};

// coords helper
const svg2page = (x,y) => page.evaluate(([x,y])=>{
  const svg=document.querySelector('.lienzo svg');
  const p=svg.createSVGPoint(); p.x=x; p.y=y;
  const q=p.matrixTransform(svg.getScreenCTM());
  return {x:q.x,y:q.y};
},[x,y]);

const dragTirador = async (idx, sx, sy) => {
  const t = await page.evaluate((i)=>{
    const ts=[...document.querySelectorAll('.lienzo circle.tirador')];
    const e=ts[i]; return {cx:+e.getAttribute('cx'), cy:+e.getAttribute('cy')};
  }, idx);
  const from = await svg2page(t.cx,t.cy);
  const to = await svg2page(sx,sy);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let k=1;k<=10;k++) await page.mouse.move(from.x+(to.x-from.x)*k/10, from.y+(to.y-from.y)*k/10);
  await page.mouse.up();
  await page.waitForTimeout(300);
};

await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
await snap('I1');
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela'}).click();
await page.waitForTimeout(3000);
await snap('I2');

// tiradores: idx0 = intercepto x (good1), idx1 = intercepto y
console.log('tiradores', await page.evaluate(()=>[...document.querySelectorAll('.lienzo circle.tirador')].map(e=>({cx:+e.getAttribute('cx'),cy:+e.getAttribute('cy')}))));
// arrastrar el de y hacia arriba un poco y ver que cambia
await dragTirador(1, 62, 100);
console.log('estado tras drag y:', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())));
await dragTirador(0, 450, 396);
console.log('estado tras drag x:', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())));
await browser.close();
