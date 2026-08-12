import {open, snap} from './lib-drive.mjs';
const {browser, page} = await open('http://localhost:57330/?lang=es');
await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
await page.waitForSelector('.q .q-opciones button', {timeout:15000});
await page.waitForTimeout(300);
console.log('AT CP:', JSON.stringify(await snap(page,'cp'),null,1));
// click correct
await page.click('.q-opciones button:nth-child(1)');
for (let i=0;i<20;i++){
  await page.waitForTimeout(500);
  const s = await snap(page,'after'+i);
  console.log(`t=${s.t} p=${s.paused} dock=${s.dockState} q=${s.q?'YES':'-'}`);
  if (s.q) console.log('   opts:', JSON.stringify(s.q.opciones.map(o=>o.cls+'|'+o.disabled)), ' html:', s.q.html.slice(0,900));
  console.log('   dockText:', s.dockText);
}
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cp1-correct.png'});
await browser.close();
