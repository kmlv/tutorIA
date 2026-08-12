import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const dockTxt = p => p.evaluate(()=>{const d=document.querySelector('.dock'); return d? d.innerText.replace(/\n+/g,' | ').trim():'(no dock)';});
async function go(label, seekTo, fn) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate((s)=>{window.__tutoria.media.seek(s); window.__tutoria.media.play();}, seekTo);
  await page.waitForSelector('.q .q-opciones button, .q-manip', {timeout:25000});
  await page.waitForTimeout(500);
  console.log('\n########', label);
  try { await fn(page); } catch(e){ console.log('  ERROR:', String(e).slice(0,300)); }
  await browser.close();
}
await go('CP2: llegada', 193, async (page) => {
  const s = await snap(page);
  console.log('  t=',s.t,'paused=',s.paused,'dock=',s.dockState);
  console.log('  q:', JSON.stringify(s.q,null,1));
  await page.screenshot({path:SHOT+'cp2-llegada.png'});
});
await go('CP2: contestar MAL', 193, async (page) => {
  const n = await page.evaluate(()=>document.querySelectorAll('.q-opciones button').length);
  console.log('  n opciones', n);
  await page.click('.q-opciones button:nth-child(2)');
  await page.waitForTimeout(2000);
  console.log('  dock:', await dockTxt(page));
  const st = await page.evaluate(()=>[...document.querySelectorAll('.q-opciones button')].map(b=>b.className+'|'+b.disabled));
  console.log('  botones:', JSON.stringify(st));
  await page.waitForTimeout(10000);
  const s=await snap(page); console.log('  +10s t=',s.t,'paused=',s.paused);
  console.log('  dock:', await dockTxt(page));
  await page.screenshot({path:SHOT+'cp2-mal.png'});
});
await go('CP2: contestar BIEN (idx0) y esperar', 193, async (page) => {
  await page.click('.q-opciones button:nth-child(1)');
  await page.waitForTimeout(2500);
  console.log('  dock:', await dockTxt(page));
  const s=await snap(page); console.log('  t=',s.t,'paused=',s.paused);
});
await go('CP2: opcion 3 y 4', 193, async (page) => {
  await page.click('.q-opciones button:nth-child(3)');
  await page.waitForTimeout(2000);
  console.log('  opt3 dock:', await dockTxt(page));
});
