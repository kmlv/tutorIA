import {abrir, qInfo} from './manip-lib.mjs';
const SS='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page} = await abrir({lang:'es'});
console.log('cargado limpio. duracion=', await page.evaluate('window.__tutoria.media.duration()'));

await page.evaluate('window.__tutoria.practice.start(); 1');
const sel = '.dock .pregunta:last-child ';
let s=null;
for (let i=0;i<16;i++){
  await page.waitForTimeout(500);
  s = await qInfo(page);
  if (!s) { continue; }
  console.log(i, s.cls, '|', (s.enun||'').slice(0,70), '|', s.nota);
  if (s.cls.includes('q-manip')) break;
  if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button');
  else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input','1'); await page.click(sel+'button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','no se'); await page.click(sel+'button[type=submit]'); }
}
console.log('MANIP:', JSON.stringify(s));

// Estado del SVG antes de tocar nada
const antes = await page.evaluate(() => {
  const svg = document.querySelector('.lienzo svg') || document.querySelector('.escenario svg');
  const g = document.querySelector('.capa-manip');
  const tir = [...document.querySelectorAll('.capa-manip circle')].map(c=>({r:c.getAttribute('r'),cx:c.getAttribute('cx'),cy:c.getAttribute('cy'),cls:c.getAttribute('class')}));
  const texts=[...document.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent);
  return {svgSel: svg? svg.getAttribute('viewBox'):null, rect: svg? svg.getBoundingClientRect().toJSON():null, tir, texts,
    aria: svg? svg.getAttribute('aria-label'):null};
});
console.log('ANTES', JSON.stringify(antes,null,1));
await page.screenshot({path:SS+'tope-0-antes.png'});
await browser.close();
