import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
// A) dos preguntas vivas a la vez
{
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
  await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button').length>0,null,{timeout:25000});
  await page.waitForTimeout(400);
  await page.click('#play');                       // saltar cp1 sin contestar
  await page.waitForTimeout(1500);
  await page.evaluate(()=>{window.__tutoria.media.seek(192.5); window.__tutoria.media.play();});
  await page.waitForFunction(()=>document.querySelectorAll('.q textarea').length>0,null,{timeout:25000});
  await page.waitForTimeout(800);
  const s = await page.evaluate(()=>({
    nq:document.querySelectorAll('.q').length,
    opciones:[...document.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim().slice(0,22)+(b.disabled?'[DIS]':'[VIVO]')),
    textareas:document.querySelectorAll('.q textarea').length,
    dock:document.querySelector('.dock').innerText.replace(/\n+/g,' | '),
  }));
  console.log('A) dos preguntas a la vez:', JSON.stringify(s,null,1));
  await page.screenshot({path:SHOT+'dos-preguntas.png'});
  // contestar la vieja de cp1 estando en cp2
  await page.click('.q-opciones button:nth-child(1)');
  await page.waitForTimeout(2000);
  console.log('  tras contestar cp1 desde cp2:', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.className+' :: '+m.textContent.trim().slice(0,60)))));
  const st = await snap(page); console.log('  t=',st.t,'paused=',st.paused);
  await browser.close();
}
// B) ?t= en la URL
{
  const {browser, page} = await open('http://localhost:57330/?lang=es&t=144');
  await page.waitForTimeout(4000);
  console.log('\nB) ?t=144 ->', await page.evaluate(()=>({t:window.__tutoria.media.currentTime(), paused:window.__tutoria.media.paused(), url:location.href})));
  await page.click('#play'); await page.waitForTimeout(2000);
  console.log('   tras pulsar play ->', await page.evaluate(()=>window.__tutoria.media.currentTime()));
  await browser.close();
}
// C) idioma mezclado en la banda de la ecuacion en cp2
{
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(193.5); window.__tutoria.media.play();});
  await page.waitForFunction(()=>document.querySelectorAll('.q textarea').length>0,null,{timeout:25000});
  await page.waitForTimeout(600);
  const txt = await page.evaluate(()=>{const b=document.querySelector('.bands')||document.querySelector('.escenario'); return b? b.innerText.replace(/\s+/g,' ').trim().slice(0,300):'(nada)';});
  console.log('\nC) banda en lang=es en cp2:', JSON.stringify(txt));
  await browser.close();
}
