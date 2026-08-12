import {abrir, hastaManip, qInfo, msgs} from './manip-lib.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page, red} = await abrir();
await hastaManip(page);
const map = await page.evaluate(()=>{const m=document.querySelector('svg.bgraph').getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
async function drag(from,to,pasos=14){
  await page.mouse.move(from[0],from[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos); await page.waitForTimeout(16);}
  await page.mouse.up(); await page.waitForTimeout(80);
}
const lineaAttrs = async()=>await page.evaluate(()=>{const l=document.querySelector('.capa-linea .recta.linea');return [l.getAttribute('x1'),l.getAttribute('y1'),l.getAttribute('x2'),l.getAttribute('y2')];});

// === A) arrastrar el CUERPO de la recta (gesto natural para "mueve la recta")
console.log('A) linea antes', await lineaAttrs());
await drag(S(210,283), S(300,200));   // punto medio de la recta, hacia afuera
console.log('A) linea despues', await lineaAttrs());
console.log('A) mensajes', await msgs(page));

// === B) arrastrar el tirador Y por ENCIMA del techo del grafico
await drag(S(62,169.75), S(62, -400));
console.log('B) tras subir Y fuera:', JSON.stringify(await page.evaluate(()=>{
  const svg=document.querySelector('svg.bgraph');
  const l=svg.querySelector('.capa-linea .recta.linea');
  return {y1:l.getAttribute('y1'), tir:[...svg.querySelectorAll('.capa-manip .tirador')].map(t=>[+t.getAttribute('cx'),+t.getAttribute('cy')]),
          txt:[...svg.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent), aria:svg.getAttribute('aria-label')};
})));
await page.screenshot({path:SP+'manip-fuera-arriba.png'});
// se puede recuperar con el raton?
console.log('B) elementFromPoint donde queda el tirador Y:', await page.evaluate((p)=>{
  const el=document.elementFromPoint(p[0],p[1]); return p+' -> '+(el?el.tagName+'.'+el.getAttribute('class'):'null');
}, S(62, await page.evaluate(()=>+document.querySelectorAll('.capa-manip .tirador')[1].getAttribute('cy')))));
await browser.close();
