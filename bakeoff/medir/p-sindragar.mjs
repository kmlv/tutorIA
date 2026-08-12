import {abrir, hastaManip, qInfo, msgs} from './manip-lib.mjs';
const {browser, page, red} = await abrir();
const s = await hastaManip(page);
console.log('MANIP:', JSON.stringify(s));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
await page.screenshot({path:SP+'manip-linea.png'});
// geometria de los tiradores
console.log('GEOM', JSON.stringify(await page.evaluate(()=>{
  const svg = document.querySelector('svg.bgraph');
  const capa = svg.querySelector('.capa-manip');
  const box = svg.getBoundingClientRect();
  const info = [...capa.children].map(el=>({tag:el.tagName, cls:el.getAttribute('class'), r:el.getAttribute('r'),
     cx:el.getAttribute('cx'), cy:el.getAttribute('cy'), rect:(()=>{const b=el.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)];})(),
     op: getComputedStyle(el).opacity, fill:getComputedStyle(el).fill, stroke:getComputedStyle(el).stroke, sw:getComputedStyle(el).strokeWidth, vis:getComputedStyle(el).visibility}));
  return {svgRect:[Math.round(box.x),Math.round(box.y),Math.round(box.width),Math.round(box.height)], info};
}), null, 1));
console.log('MSGS antes', await msgs(page));
red.length = 0;
// CONFIRMAR SIN ARRASTRAR
await page.click('.dock .pregunta:last-child button');
await page.waitForTimeout(2500);
console.log('RED tras Listo:', JSON.stringify(red, null, 1));
console.log('MSGS despues', await msgs(page));
console.log('Q ahora:', JSON.stringify(await qInfo(page)));
console.log('practice activo?', await page.evaluate('window.__tutoria.practice.active'));
await page.screenshot({path:SP+'manip-sindragar.png'});
await browser.close();
