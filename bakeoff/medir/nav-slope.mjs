import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
// 1) pregunta limpia en 123.864
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
  await page.evaluate(()=>window.__tutoria.media.seek(121));
  await page.waitForTimeout(400); await page.click('#play');
  await page.waitForSelector('.q',{timeout:20000}); await page.waitForTimeout(700);
  const s = await page.evaluate(SNAP);
  console.log('LIMPIO t=123.86 ->', JSON.stringify({t:s.t, q:s.q}, null, 1));
  await browser.close();
}
// 2) práctica + seek a zona tranquila
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
  await page.evaluate(()=>window.__tutoria.media.seek(230.5));
  await page.waitForTimeout(400); await page.click('#play');
  await page.waitForSelector('.q',{timeout:25000}); await page.waitForTimeout(1500);
  console.log('práctica activa, q =', await page.evaluate(()=>document.querySelector('.q-enunciado')?.textContent.slice(0,50)));
  await page.evaluate(()=>window.__tutoria.media.seek(60));
  await page.waitForTimeout(1500);
  let s = await page.evaluate(SNAP);
  console.log('tras seek(60):', JSON.stringify({t:s.t, paused:s.paused, play:s.play, dock:s.dockEstado, q:s.q?s.q.enunciado.slice(0,45):null}));
  await page.click('#play');
  for (let i=0;i<5;i++){
    await page.waitForTimeout(4000);
    s = await page.evaluate(SNAP);
    console.log(`  t=${s.t.toFixed(1)}`, JSON.stringify({paused:s.paused, dock:s.dockEstado, q:s.q?s.q.enunciado.slice(0,45):null, cap:(s.caption||'').slice(0,40)}));
  }
  console.log('practice:', JSON.stringify(await page.evaluate(()=>({running:window.__tutoria.practice.running, served:window.__tutoria.practice.served}))));
  await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/practica-seek60.png'});
  await browser.close();
}
if(errores.length) console.log('ERRORES', errores);
