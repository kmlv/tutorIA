import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const dockTxt = p => p.evaluate(()=>(document.querySelector('.dock')||{}).innerText.replace(/\n+/g,' | ').trim());
async function go(label, fn) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
  await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button').length>0, null, {timeout:25000});
  await page.waitForTimeout(400);
  console.log('\n########', label);
  try { await fn(page); } catch(e){ console.log('  ERROR:', String(e).slice(0,250)); }
  await browser.close();
}
await go('H: Seguir sin contestar, y contestar 15s despues (mientras suena)', async (page)=>{
  await page.click('#play');
  await page.waitForTimeout(15000);
  const s1 = await snap(page); console.log('  antes de contestar: t=',s1.t,'paused=',s1.paused, 'subtitulo=', s1.captions?.slice(0,80));
  await page.click('.q-opciones button:nth-child(1)');
  await page.waitForTimeout(2500);
  const s2 = await snap(page); console.log('  tras contestar bien: t=',s2.t,'paused=',s2.paused,'dock=',s2.dockState);
  console.log('  dock:', await dockTxt(page));
  await page.screenshot({path:SHOT+'contestar-tarde.png'});
});
await go('I: Listo,sigamos SIN contestar', async (page)=>{
  await page.evaluate(()=>{[...document.querySelectorAll('.dock button')].find(b=>b.textContent.trim()==='Listo, sigamos').click();});
  await page.waitForTimeout(3000);
  const s = await snap(page); console.log('  t=',s.t,'paused=',s.paused,'dock=',s.dockState);
  console.log('  dock:', await dockTxt(page));
  // el checkpoint vuelve a salir al llegar a cp2?
  await page.evaluate(()=>{window.__tutoria.media.seek(193.5);});
  await page.waitForTimeout(4000);
  const n = await page.evaluate(()=>({nq:document.querySelectorAll('.q').length, opt:document.querySelectorAll('.q-opciones button').length, ta:document.querySelectorAll('.q textarea').length}));
  console.log('  en cp2 quedan:', JSON.stringify(n));
  console.log('  dock:', await dockTxt(page));
});
await go('J: cuota de preguntas del composer', async (page)=>{
  for (let i=1;i<=4;i++){
    await page.fill('.composer-input', 'pregunta numero '+i);
    await page.click('.composer-enviar');
    await page.waitForTimeout(7000);
    const cont = await page.evaluate(()=>{
      const el=[...document.querySelectorAll('.dock *')].map(e=>e.textContent.trim()).filter(t=>/^\d+ preguntas?$/.test(t));
      return el;
    });
    console.log(`  tras pregunta ${i}: contador=`, JSON.stringify(cont));
  }
  await page.screenshot({path:SHOT+'cuota.png'});
});
