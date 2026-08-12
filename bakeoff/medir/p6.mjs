import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const dockTxt = p => p.evaluate(()=>{const d=document.querySelector('.dock'); return d? d.innerText.replace(/\n+/g,' | ').trim():'(no dock)';});
async function go(label, seekTo, fn) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate((s)=>{window.__tutoria.media.seek(s); window.__tutoria.media.play();}, seekTo);
  await page.waitForSelector('.q .q-opciones button', {timeout:20000});
  await page.waitForTimeout(400);
  console.log('\n########', label);
  try { await fn(page); } catch(e){ console.log('  ERROR:', String(e).slice(0,300)); }
  await browser.close();
}

await go('E: estilos de las opciones antes/despues de contestar', 143, async (page) => {
  const styles = () => page.evaluate(()=>[...document.querySelectorAll('.q-opciones button')].map(b=>{
    const cs=getComputedStyle(b);
    return {t:b.textContent.trim().slice(0,20), cls:b.className, bg:cs.backgroundColor, color:cs.color, border:cs.borderColor, op:cs.opacity, fw:cs.fontWeight};
  }));
  console.log('  ANTES:', JSON.stringify(await styles(),null,0));
  await page.click('.q-opciones button:nth-child(1)');
  await page.waitForTimeout(800);
  console.log('  DESPUES (correcto=idx0):', JSON.stringify(await styles(),null,0));
});

await go('F: pulsar #play / Seguir con el checkpoint SIN contestar', 143, async (page) => {
  const before = await snap(page); console.log('  antes: t=',before.t,'paused=',before.paused,'dock=',before.dockState);
  const playSel = await page.$('#play');
  console.log('  #play existe:', !!playSel, 'texto:', playSel? (await playSel.textContent()).trim() : '-');
  await page.click('#play');
  for (let i=0;i<6;i++){ await page.waitForTimeout(900); const s=await snap(page);
    console.log(`   t=${s.t} paused=${s.paused} dock=${s.dockState} q=${s.q?'YES':'-'} qvis=${s.q?s.q.visible:'-'}`); }
  console.log('  dock:', await dockTxt(page));
  await page.screenshot({path:SHOT+'play-sin-contestar.png'});
});

await go('G: contestar, seguir, rebobinar a 140 y volver a pasar por cp1', 143, async (page) => {
  await page.click('.q-opciones button:nth-child(1)');
  await page.waitForTimeout(600);
  await page.evaluate(()=>{ [...document.querySelectorAll('.dock button')].find(b=>b.textContent.trim()==='Listo, sigamos').click(); });
  await page.waitForTimeout(2500);
  console.log('  tras seguir: ', JSON.stringify(await snap(page)).slice(0,200));
  await page.evaluate(()=>{window.__tutoria.media.seek(141); window.__tutoria.media.play();});
  for (let i=0;i<10;i++){ await page.waitForTimeout(800); const s=await snap(page);
    console.log(`   t=${s.t} paused=${s.paused} dock=${s.dockState} q=${s.q?'YES':'-'}`);
    if (s.paused && s.t>144) break; }
  const st = await page.evaluate(()=>[...document.querySelectorAll('.q-opciones button')].map(b=>b.className+'|'+b.disabled));
  console.log('  estado botones tras revisitar:', JSON.stringify(st));
  console.log('  dock:', await dockTxt(page));
  await page.screenshot({path:SHOT+'revisita-cp1.png'});
});
