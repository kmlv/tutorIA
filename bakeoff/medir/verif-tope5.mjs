import {abrir, qInfo} from './manip-lib.mjs';
const {browser, page} = await abrir({lang:'es'});
await page.evaluate('window.__tutoria.practice.start(); 1');
const sel = '.dock .pregunta:last-child ';
let s=null;
for (let i=0;i<16;i++){ await page.waitForTimeout(500); s=await qInfo(page); if(!s) continue;
  if (s.cls.includes('q-manip')) break;
  if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button');
  else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input','1'); await page.click(sel+'button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','no se'); await page.click(sel+'button[type=submit]'); } }
const pos = async () => page.evaluate(()=>{const c=[...document.querySelectorAll('.capa-manip circle')][1];
  return +c.getAttribute('cx');});
const act = () => page.evaluate(()=>{const a=document.activeElement;return a.tagName+'#'+(a.id||'')+'.'+(a.className.baseVal??a.className)+' role='+a.getAttribute('role');});
const t0 = await page.evaluate(()=>{const c=[...document.querySelectorAll('.capa-manip circle')][1];
  const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.ownerSVGElement.getScreenCTM());return {sx:p.x,sy:p.y};});
await page.mouse.move(t0.sx,t0.sy); await page.mouse.down();
for (const x of [700,900,1100,1279]) { await page.mouse.move(x,t0.sy,{steps:5}); await page.waitForTimeout(50);}
await page.mouse.up(); await page.waitForTimeout(200);
console.log('cx fuera =', await pos(), '| foco =', await act());
// A) escribir en el composer (lo que hace un alumno perdido: preguntar al tutor)
await page.click('.composer-input'); await page.waitForTimeout(150);
console.log('foco tras clicar el composer:', await act());
const a1 = await pos(); for (let n=0;n<10;n++) await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(200);
const a2 = await pos(); console.log('ArrowLeft x10 con foco en el composer: cx', a1, '->', a2, a1===a2?'(NO se mueve)':'(SI se mueve)');
// B) volver a dar foco: ¿se puede con Tab?
await page.keyboard.press('Tab'); console.log('tras Tab:', await act());
for (let n=0;n<12;n++){ await page.keyboard.press('Tab'); const f=await act(); if (f.includes('role=slider')) { console.log('slider alcanzable con Tab en la pulsacion', n+2); break; } if(n===11) console.log('slider NO alcanzado en 13 Tabs; ultimo foco:', f); }
const b1 = await pos(); for (let n=0;n<10;n++) await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(200);
console.log('ArrowLeft x10 tras Tab: cx', b1, '->', await pos());
await browser.close();
