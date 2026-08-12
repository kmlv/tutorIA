import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.evaluate(()=>window.__tutoria.media.seek(150));
await page.waitForTimeout(600);
await page.click('.transcript summary');
await page.waitForTimeout(600);
const rows = await page.evaluate(()=>[...document.querySelectorAll('.transcript-row')].slice(0,6).map(r=>({txt:r.textContent.slice(0,40), tag:r.tagName, cls:r.className, hasBtn:!!r.querySelector('button,a'), tabindex:r.getAttribute('tabindex')})));
console.log('filas:', JSON.stringify(rows,null,1));
const n = await page.evaluate(()=>document.querySelectorAll('.transcript-row').length);
console.log('nº filas:', n);
// clic en una fila temprana
const antes = await page.evaluate(()=>window.__tutoria.media.currentTime());
await page.evaluate(()=>{ const r=document.querySelectorAll('.transcript-row')[3]; r.scrollIntoView(); r.click(); });
await page.waitForTimeout(1200);
const despues = await page.evaluate(()=>window.__tutoria.media.currentTime());
console.log('clic en fila 3: t antes', antes, '-> t después', despues, (antes===despues?' (NO NAVEGA)':''));
// ¿hay algún control de línea de tiempo en la UI?
const controles = await page.evaluate(()=>{
  const vis=(e)=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.opacity!=='0';};
  return [...document.querySelectorAll('input[type=range],progress,.scrub,.timeline,.barra,[role=slider]')].filter(vis).map(e=>e.tagName+'.'+e.className);
});
console.log('controles de línea de tiempo visibles:', JSON.stringify(controles));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/transcripcion.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
