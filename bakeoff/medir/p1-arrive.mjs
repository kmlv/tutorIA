import {open, snap} from './lib-drive.mjs';
const {browser, page} = await open('http://localhost:57330/?lang=es&t=142');
console.log('--- after load at t=142 ---');
console.log(JSON.stringify(await snap(page,'load'),null,1));
await page.evaluate(()=>window.__tutoria.media.play());
for (let i=0;i<14;i++) {
  await page.waitForTimeout(500);
  const s = await snap(page,'tick'+i);
  console.log(s.t, 'paused='+s.paused, 'dock='+s.dockState, 'q?='+(s.q?'YES':'no'));
  if (s.q) { console.log(JSON.stringify(s,null,1)); break; }
}
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cp1.png'});
await browser.close();
