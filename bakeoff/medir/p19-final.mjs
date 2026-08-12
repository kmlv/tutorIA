import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
// A: feedback de cada opcion de cp1
for (const idx of [1,2,3,4]) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
  await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button').length>0,null,{timeout:25000});
  await page.waitForTimeout(400);
  await page.click(`.q-opciones button:nth-child(${idx})`);
  await page.waitForTimeout(2000);
  const m = await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(x=>x.className+' :: '+x.textContent.trim()));
  console.log(`opcion ${idx}:`, JSON.stringify(m));
  await browser.close();
}
