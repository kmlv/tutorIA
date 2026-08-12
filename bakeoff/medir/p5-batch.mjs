import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const dockTxt = p => p.evaluate(()=>{const d=document.querySelector('.dock'); return d? d.innerText.replace(/\n+/g,' | ').trim():'(no dock)';});
async function go(label, seekTo, fn) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate((s)=>{window.__tutoria.media.seek(s); window.__tutoria.media.play();}, seekTo);
  await page.waitForSelector('.q .q-opciones button', {timeout:20000});
  await page.waitForTimeout(400);
  console.log('\n########', label);
  try { await fn(page); } catch(e){ console.log('  ERROR EN PRUEBA:', String(e).slice(0,200)); }
  await browser.close();
}

await go('A: NO CONTESTAR, esperar 45s', 143, async (page) => {
  for (let i=0;i<9;i++){ await page.waitForTimeout(5000); const s=await snap(page);
    console.log(`  +${(i+1)*5}s t=${s.t} paused=${s.paused} dock=${s.dockState}`); }
  console.log('  dock:', await dockTxt(page));
  await page.screenshot({path:SHOT+'sin-contestar-45s.png'});
});

await go('B: DOBLE CLIC en la misma opcion correcta', 143, async (page) => {
  const b = await page.$('.q-opciones button:nth-child(1)');
  await b.click({force:true});
  await page.waitForTimeout(120);
  try { await b.click({force:true, timeout:2000}); console.log('  segundo clic ACEPTADO'); }
  catch(e){ console.log('  segundo clic rechazado:', String(e).slice(0,80)); }
  await page.evaluate(()=>{const b=document.querySelector('.q-opciones button'); b.click(); b.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  await page.waitForTimeout(1500);
  console.log('  dock:', await dockTxt(page));
});

await go('C: CORRECTO y esperar 30s (se reanuda sola?)', 143, async (page) => {
  await page.click('.q-opciones button:nth-child(1)');
  for (let i=0;i<6;i++){ await page.waitForTimeout(5000); const s=await snap(page);
    console.log(`  +${(i+1)*5}s t=${s.t} paused=${s.paused} dock=${s.dockState}`); }
  console.log('  dock:', await dockTxt(page));
  await page.screenshot({path:SHOT+'correcto-espera.png'});
});

await go('D: WRONG -> ¿Por qué? esperando 15s', 143, async (page) => {
  await page.click('.q-opciones button:nth-child(2)');
  await page.waitForTimeout(1500);
  const before = await dockTxt(page);
  await page.evaluate(()=>{ [...document.querySelectorAll('.dock button')].find(b=>b.textContent.trim()==='¿Por qué?').click(); });
  for (let i=0;i<5;i++){ await page.waitForTimeout(3000);
    const now = await dockTxt(page);
    console.log(`  +${(i+1)*3}s cambio=${now!==before} len=${now.length}`); }
  console.log('  dock final:', await dockTxt(page));
  await page.screenshot({path:SHOT+'wrong-porque-15s.png'});
});
