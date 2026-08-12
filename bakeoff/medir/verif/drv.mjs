import {abrir} from './_lib.mjs';
export const svg2page = (page,x,y) => page.evaluate(([x,y])=>{
  const svg=document.querySelector('.lienzo svg');
  const p=svg.createSVGPoint(); p.x=x; p.y=y;
  const q=p.matrixTransform(svg.getScreenCTM()); return {x:q.x,y:q.y};
},[x,y]);

export async function snap(page,t){
  const i = await page.evaluate(() => {
    const r = e => { if(!e) return null; const b=e.getBoundingClientRect(); return {top:Math.round(b.top),bottom:Math.round(b.bottom)}; };
    const qs=[...document.querySelectorAll('.q')];
    return {scrollY:Math.round(scrollY), docH:document.documentElement.scrollHeight,
      innerH:innerHeight, nQ:qs.length, ultimo:qs.at(-1)?.className,
      enun:qs.at(-1)?.querySelector('.q-enunciado')?.textContent,
      lienzo:r(document.querySelector('.lienzo')), play:r(document.querySelector('#play')),
      esc:r(document.querySelector('.escenario')), dock:r(document.querySelector('.dock'))};
  });
  console.log(t, JSON.stringify(i));
  return i;
}
export async function dragTo(page, idx, sx, sy){
  const t = await page.evaluate(i=>{const e=[...document.querySelectorAll('.capa-manip circle.tirador')][i];return{cx:+e.getAttribute('cx'),cy:+e.getAttribute('cy')};}, idx);
  const from = await svg2page(page,t.cx,t.cy);
  const to = await svg2page(page,sx,sy);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let k=1;k<=12;k++){ await page.mouse.move(from.x+(to.x-from.x)*k/12, from.y+(to.y-from.y)*k/12); await page.waitForTimeout(20);}
  await page.mouse.up();
  await page.waitForTimeout(300);
}
export async function ultimoHTML(page){
  return page.evaluate(()=>document.querySelectorAll('.q').length? [...document.querySelectorAll('.q')].at(-1).outerHTML.slice(0,1600):null);
}
