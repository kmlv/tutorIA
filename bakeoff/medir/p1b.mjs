import {open, snap} from './lib-drive.mjs';
const {browser, page} = await open('http://localhost:57330/?lang=es&t=142');
for (let i=0;i<6;i++){ await page.waitForTimeout(400); console.log('t param check', await page.evaluate(()=>window.__tutoria.media.currentTime())); }
await page.evaluate(()=>window.__tutoria.media.seek(142));
await page.waitForTimeout(300);
console.log('after seek', await page.evaluate(()=>window.__tutoria.media.currentTime()));
await page.evaluate(()=>window.__tutoria.media.play());
for (let i=0;i<30;i++) {
  await page.waitForTimeout(400);
  const s = await snap(page,'t'+i);
  process.stdout.write(`${s.t} p=${s.paused} dock=${s.dockState} q=${s.q?'YES':'-'}\n`);
  if (s.q) { console.log(JSON.stringify(s.q,null,1)); break; }
}
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cp1.png'});
await browser.close();
