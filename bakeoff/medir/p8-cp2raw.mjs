import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const {browser, page} = await open('http://localhost:57330/?lang=es');
await page.evaluate(()=>{window.__tutoria.media.seek(192); window.__tutoria.media.play();});
for (let i=0;i<20;i++){
  await page.waitForTimeout(700);
  const s = await page.evaluate(()=>({
    t:+window.__tutoria.media.currentTime().toFixed(2),
    paused:window.__tutoria.media.paused(),
    dock:window.__tutoria.dock?window.__tutoria.dock.actual:null,
    nq:document.querySelectorAll('.q').length,
    nopt:document.querySelectorAll('.q-opciones button').length,
    nmanip:document.querySelectorAll('.q-manip').length,
    dockTxt:(document.querySelector('.dock')||{}).innerText?.replace(/\n+/g,' | ').trim().slice(-500),
  }));
  console.log(JSON.stringify(s));
}
await page.screenshot({path:SHOT+'cp2-raw.png'});
await browser.close();
