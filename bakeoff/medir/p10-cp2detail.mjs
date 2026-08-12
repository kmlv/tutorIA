import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const state = p => p.evaluate(()=>({
  full:(document.querySelector('.dock')||{}).innerText,
  ta: (()=>{const t=document.querySelector('.q textarea'); return t?{val:t.value, disabled:t.disabled, n:document.querySelectorAll('.q textarea').length}:null;})(),
  nq: document.querySelectorAll('.q').length,
  respBtn: (()=>{const b=[...document.querySelectorAll('.q button')].find(x=>x.textContent.trim()==='Responder'); return b?{disabled:b.disabled}:null;})(),
  t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(),
}));
const {browser, page} = await open('http://localhost:57330/?lang=es');
await page.evaluate(()=>{window.__tutoria.media.seek(193.5); window.__tutoria.media.play();});
await page.waitForFunction(()=>document.querySelectorAll('.q textarea').length>0, null, {timeout:25000});
await page.waitForTimeout(400);
console.log('LLEGADA:', JSON.stringify(await state(page),null,1));
for (const txt of ['El jugo cuesta menos que el cafe, por eso', 'porque si', 'asdf']) {
  await page.fill('.q textarea', txt);
  await page.evaluate(()=>{[...document.querySelectorAll('.q button')].find(b=>b.textContent.trim()==='Responder').click();});
  await page.waitForTimeout(7000);
  const s = await state(page);
  console.log(`\n--- envie: "${txt}"`);
  console.log('  dock innerText:', JSON.stringify(s.full));
  console.log('  textarea:', JSON.stringify(s.ta), 'boton:', JSON.stringify(s.respBtn), 'nq=',s.nq, 't=',s.t,'paused=',s.paused);
}
await page.screenshot({path:SHOT+'cp2-detalle.png'});
// ahora pulsar Listo, sigamos
await page.evaluate(()=>{ [...document.querySelectorAll('.dock button')].find(b=>b.textContent.trim()==='Listo, sigamos').click(); });
await page.waitForTimeout(3000);
const s2 = await state(page);
console.log('\n--- tras Listo, sigamos:  t=',s2.t,'paused=',s2.paused);
console.log('  dock:', JSON.stringify(s2.full));
await browser.close();
