import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const dockTxt = p => p.evaluate(()=>{const d=document.querySelector('.dock'); return d? d.innerText.replace(/\n+/g,' | ').trim():'(no dock)';});
const chips = p => p.evaluate(()=>[...document.querySelectorAll('.dock button')].map(b=>b.textContent.trim()+(b.disabled?'[DIS]':'')));

async function go(label, fn) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
  await page.waitForSelector('.q .q-opciones button', {timeout:15000});
  await page.waitForTimeout(400);
  console.log('\n########', label);
  await fn(page);
  await browser.close();
}

// 1) wrong then click each chip
await go('WRONG -> ¿Por qué?', async (page) => {
  await page.click('.q-opciones button:nth-child(2)');
  await page.waitForTimeout(1000);
  const btn = await page.$('.dock button:text-is("¿Por qué?")');
  await page.evaluate(()=>{ [...document.querySelectorAll('.dock button')].find(b=>b.textContent.trim()==='¿Por qué?').click(); });
  await page.waitForTimeout(2500);
  console.log('dock:', await dockTxt(page));
  const s = await snap(page); console.log('t=',s.t,'paused=',s.paused);
  await page.screenshot({path:SHOT+'wrong-porque.png'});
});

await go('WRONG -> No entiendo', async (page) => {
  await page.click('.q-opciones button:nth-child(2)');
  await page.waitForTimeout(1000);
  await page.evaluate(()=>{ [...document.querySelectorAll('.dock button')].find(b=>b.textContent.trim()==='No entiendo').click(); });
  await page.waitForTimeout(2500);
  console.log('dock:', await dockTxt(page));
  console.log('chips:', JSON.stringify(await chips(page)));
});

await go('WRONG -> Listo, sigamos', async (page) => {
  await page.click('.q-opciones button:nth-child(2)');
  await page.waitForTimeout(1000);
  await page.evaluate(()=>{ [...document.querySelectorAll('.dock button')].find(b=>b.textContent.trim()==='Listo, sigamos').click(); });
  for (let i=0;i<8;i++){ await page.waitForTimeout(700); const s=await snap(page); console.log('  t=',s.t,'paused=',s.paused,'dock=',s.dockState,'q=',s.q?'YES':'-'); }
  console.log('dock:', await dockTxt(page));
  await page.screenshot({path:SHOT+'wrong-sigamos.png'});
});

await go('WRONG -> escribir respuesta en el composer', async (page) => {
  await page.click('.q-opciones button:nth-child(2)');
  await page.waitForTimeout(1000);
  await page.fill('.composer-input', 'No, el precio relativo no cambia');
  await page.click('.composer-enviar');
  await page.waitForTimeout(3500);
  console.log('dock:', await dockTxt(page));
  console.log('chips:', JSON.stringify(await chips(page)));
  const s = await snap(page); console.log('t=',s.t,'paused=',s.paused,'q=',s.q?'YES':'-');
  await page.screenshot({path:SHOT+'wrong-composer.png'});
});
