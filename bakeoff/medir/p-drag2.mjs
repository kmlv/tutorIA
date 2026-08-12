import {abrir, hastaManip, qInfo, msgs} from './manip-lib.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page, red} = await abrir();
console.log('MANIP:', JSON.stringify(await hastaManip(page)));
const map = await page.evaluate(()=>{const m=document.querySelector('svg.bgraph').getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
const snap = async ()=> await page.evaluate(()=>{
  const svg=document.querySelector('svg.bgraph');
  const g=(s)=>[...svg.querySelectorAll(s)];
  return {
    tiradores: g('.capa-manip .tirador').map(t=>[+t.getAttribute('cx'),+t.getAttribute('cy')]),
    interCircles: g('.capa-interceptos circle').map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy')]),
    interRects: g('.capa-interceptos rect').map(c=>[+c.getAttribute('x'),+c.getAttribute('y')]),
    interTexts: g('.capa-interceptos text').map(t=>[t.textContent, t.getAttribute('x'), t.getAttribute('y')]),
    linea: (()=>{const l=svg.querySelector('.capa-linea .recta.linea'); return [l.getAttribute('x1'),l.getAttribute('y1'),l.getAttribute('x2'),l.getAttribute('y2')];})(),
  };
});
async function drag(from,to,pasos=14){
  await page.mouse.move(from[0],from[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos); await page.waitForTimeout(16);}
  await page.mouse.up(); await page.waitForTimeout(80);
}
console.log('ANTES', JSON.stringify(await snap()));
// objetivo correcto: intercepto x = 50 -> px 502.6 ; intercepto y = 150 -> py 56.6
await drag(S(355.75,396), S(502.6,396));
console.log('TRAS MOVER X', JSON.stringify(await snap()));
await drag(S(62,169.75), S(62,56.6));
console.log('TRAS MOVER Y', JSON.stringify(await snap()));
await page.screenshot({path:SP+'manip-correcto.png'});
red.length=0;
await page.click('.dock .pregunta:last-child button');
await page.waitForTimeout(1800);
console.log('RED', JSON.stringify(red.filter(r=>String(r.u||r.resp).includes('answer')||String(r.u||r.resp).includes('next')),null,1));
console.log('MSGS', await msgs(page));
console.log('Q ahora', JSON.stringify(await qInfo(page)));
await browser.close();
