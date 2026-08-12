import {abrir, qInfo} from './manip-lib.mjs';
const SS='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page} = await abrir({lang:'es'});
await page.evaluate('window.__tutoria.practice.start(); 1');
const sel = '.dock .pregunta:last-child ';
let s=null;
for (let i=0;i<16;i++){ await page.waitForTimeout(500); s=await qInfo(page); if(!s) continue;
  if (s.cls.includes('q-manip')) break;
  if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button');
  else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input','1'); await page.click(sel+'button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','no se'); await page.click(sel+'button[type=submit]'); } }
const pos = async () => page.evaluate(()=>{ const c=[...document.querySelectorAll('.capa-manip circle')][1];
  const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.ownerSVGElement.getScreenCTM());
  return {cx:+c.getAttribute('cx'),sx:p.x,sy:p.y};});
const t0 = await pos();
await page.mouse.move(t0.sx, t0.sy); await page.mouse.down();
for (const x of [700,900,1100,1279]) { await page.mouse.move(x, t0.sy, {steps:5}); await page.waitForTimeout(60);}
await page.mouse.up(); await page.waitForTimeout(200);
console.log('fuera:', JSON.stringify(await pos()));
const act = () => page.evaluate(()=>{const a=document.activeElement;return a.tagName+' role='+a.getAttribute('role');});
console.log('foco tras soltar:', await act());
// El alumno hace lo natural: clicar en el grafico buscando el tirador
await page.mouse.click(400, 450); await page.waitForTimeout(150);
console.log('foco tras 1 click en el lienzo vacio:', await act());
for (let n=0;n<10;n++) await page.keyboard.press('ArrowLeft');
console.log('tras 10 ArrowLeft con ese foco:', JSON.stringify(await pos()));
// y si clica en el dock?
await page.mouse.click(1090, 300); await page.waitForTimeout(150);
console.log('foco tras click en el dock:', await act());
for (let n=0;n<10;n++) await page.keyboard.press('ArrowLeft');
console.log('tras 10 ArrowLeft mas:', JSON.stringify(await pos()));
// ¿Y si pulsa Listo con la recta rota? ¿que dice y que pasa despues?
await page.click(sel+'button');
await page.waitForTimeout(2500);
console.log('mensajes:', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.textContent).slice(-4))));
console.log('siguiente pregunta:', JSON.stringify(await qInfo(page)));
await page.screenshot({path:SS+'tope-D-tras-listo.png'});
await browser.close();
