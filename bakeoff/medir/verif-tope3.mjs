import {abrir, qInfo} from './manip-lib.mjs';
const SS='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const VARIANTE = process.argv[2]; // 'x' | 'y'
const {browser, page} = await abrir({lang:'es'});
await page.evaluate('window.__tutoria.practice.start(); 1');
const sel = '.dock .pregunta:last-child ';
let s=null;
for (let i=0;i<16;i++){
  await page.waitForTimeout(500);
  s = await qInfo(page); if (!s) continue;
  if (s.cls.includes('q-manip')) break;
  if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button');
  else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input','1'); await page.click(sel+'button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','no se'); await page.click(sel+'button[type=submit]'); }
}
const IDX = VARIANTE==='y' ? 3 : 1;
const pos = async () => page.evaluate((i)=>{ const c=[...document.querySelectorAll('.capa-manip circle')][i];
  const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.ownerSVGElement.getScreenCTM());
  return {cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy'),sx:p.x,sy:p.y};}, IDX);
const t0 = await pos();
console.log('ANTES', VARIANTE, JSON.stringify(t0));

await page.mouse.move(t0.sx, t0.sy); await page.mouse.down();
if (VARIANTE==='y') { for (const y of [400,200,50,0]) { await page.mouse.move(t0.sx, y, {steps:5}); await page.waitForTimeout(60);} }
else { for (const x of [700,900,1100,1279]) { await page.mouse.move(x, t0.sy, {steps:5}); await page.waitForTimeout(60);} }
await page.mouse.up(); await page.waitForTimeout(300);
console.log('DESPUES', JSON.stringify(await pos()));
console.log('elementFromPoint:', await page.evaluate((i)=>{ const c=[...document.querySelectorAll('.capa-manip circle')][i];
  const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.ownerSVGElement.getScreenCTM());
  const el=document.elementFromPoint(p.x,p.y); return {px:p.x,py:p.y, el: el? el.tagName+'.'+(el.className.baseVal??el.className):null};}, IDX));
console.log('textos intercepto:', await page.evaluate(()=>[...document.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent)));
console.log('aria:', await page.evaluate(()=>document.querySelector('.capa-manip').ownerSVGElement.getAttribute('aria-label')));
await page.screenshot({path:SS+'tope-'+VARIANTE+'-fuera.png'});

// ESCAPE 1: teclado INMEDIATAMENTE despues de soltar (sin tocar nada mas)
const foco = await page.evaluate(()=>{const a=document.activeElement; return a.tagName+' role='+a.getAttribute('role');});
console.log('activeElement justo tras soltar:', foco);
const key = VARIANTE==='y' ? 'ArrowDown' : 'ArrowLeft';
for (let n=0;n<5;n++) await page.keyboard.press(key);
console.log('tras 5x '+key+':', JSON.stringify(await pos()));
let pulsaciones = 5;
for (let n=0;n<300;n++){ await page.keyboard.press(key); pulsaciones++;
  const p = await pos(); if (VARIANTE==='y' ? p.cy>=0 : p.cx<=520) break; }
console.log('pulsaciones totales para volver a entrar en el viewBox:', pulsaciones, JSON.stringify(await pos()));
await browser.close();
