import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.waitForTimeout(600);
await page.evaluate(()=>window.__tutoria.media.seek(200));
await page.waitForTimeout(500);
await page.click('#play');
for (let i=0;i<9;i++){
  await page.waitForTimeout(2000);
  const s = await page.evaluate(SNAP);
  console.log(`t=${s.t}`.padEnd(9), JSON.stringify({reloj:s.reloj, p1:s.estado.p1, cards:s.cards.map(c=>c.precio), compact:s.ledgerCompact,
    eq:(s.eq||'').replace(/​/g,'').slice(0,70), cap:(s.caption||'').slice(0,45), q:s.q?s.q.enunciado.slice(0,40):null, dock:s.dockEstado}));
}
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/recap.png'});
// texto renderizado de la banda
console.log('BANDA TEXTO:', JSON.stringify(await page.evaluate(()=>document.querySelector('.eq-slot')?.innerText.replace(/\s+/g,' '))));
if(errores.length) console.log('ERRORES', errores);
await browser.close();
