import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const dockTxt = p => p.evaluate(()=>{const d=document.querySelector('.dock'); return d? d.innerText.replace(/\n+/g,' | ').trim():'(no dock)';});
async function go(label, fn) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(193.5); window.__tutoria.media.play();});
  await page.waitForFunction(()=>document.querySelectorAll('.q textarea').length>0, null, {timeout:25000});
  await page.waitForTimeout(400);
  console.log('\n########', label);
  try { await fn(page); } catch(e){ console.log('  ERROR:', String(e).slice(0,300)); }
  await browser.close();
}
const fill = async (page, txt) => {
  await page.fill('.q textarea', txt);
  await page.evaluate(()=>{[...document.querySelectorAll('.q button')].find(b=>b.textContent.trim()==='Responder').click();});
};
await go('CP2 A: enviar VACIO', async (page)=>{
  const before = await dockTxt(page);
  await page.evaluate(()=>{[...document.querySelectorAll('.q button')].find(b=>b.textContent.trim()==='Responder').click();});
  await page.waitForTimeout(4000);
  const after = await dockTxt(page);
  console.log('  cambio?', before!==after);
  console.log('  dock:', after);
  const s=await snap(page); console.log('  t=',s.t,'paused=',s.paused);
  await page.screenshot({path:SHOT+'cp2-vacio.png'});
});
await go('CP2 B: respuesta CORRECTA', async (page)=>{
  await fill(page, 'Porque si gastas todo el ingreso en jugo no compras cafe, y el precio del jugo no cambio: m/p2 sigue igual.');
  await page.waitForTimeout(6000);
  console.log('  dock:', await dockTxt(page));
  const s=await snap(page); console.log('  t=',s.t,'paused=',s.paused, 'dockState=',s.dockState);
  await page.screenshot({path:SHOT+'cp2-bien.png'});
});
await go('CP2 C: respuesta ERRONEA repetida', async (page)=>{
  for (let i=1;i<=3;i++){
    const has = await page.evaluate(()=>document.querySelectorAll('.q textarea').length);
    console.log(`  ronda ${i}: textareas=${has}`);
    if(!has) { console.log('   NO HAY DONDE ESCRIBIR'); break; }
    await fill(page, i===1?'Porque el jugo es mas barato':'Porque la pendiente no cambia');
    await page.waitForTimeout(7000);
    console.log('   dock:', (await dockTxt(page)).slice(-450));
    const s=await snap(page); console.log('   t=',s.t,'paused=',s.paused);
  }
  await page.screenshot({path:SHOT+'cp2-mal-x3.png'});
});
await go('CP2 D: basura ("asdf")', async (page)=>{
  await fill(page, 'asdf');
  await page.waitForTimeout(7000);
  console.log('  dock:', (await dockTxt(page)).slice(-500));
  const s=await snap(page); console.log('  t=',s.t,'paused=',s.paused);
  await page.screenshot({path:SHOT+'cp2-basura.png'});
});
