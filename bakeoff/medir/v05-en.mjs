import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('request', r => { if (r.url().includes('/api/')) console.log('  REQ', r.method(), r.url().split('/').slice(-1)[0], (r.postData()||'').slice(0,120)); });
await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const cues = await page.evaluate(() => (window.__tutoriaSesion.media.cues||[]).filter(c=>/check|cp/i.test(JSON.stringify(c))).map(c=>({t:c.t, tipo:c.tipo||c.type, id:c.id})));
console.log('CUES checkpoint EN:', JSON.stringify(cues));
const t = cues.length ? cues[0].t - 2 : 143;
await page.evaluate(`window.__tutoria.media.seek(${t}); window.__tutoria.media.play()`);
await page.waitForTimeout(5000);
console.log('t=', await page.evaluate('window.__tutoria.media.currentTime()'), 'dock=', await page.evaluate('window.__tutoria.dock.actual'));
console.log('chips:', JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('.dock button.intencion')).map(b=>b.textContent))));
for (const c of ["I don't get it",'Why?','Slower','Another example']) {
  const b = page.locator('.dock button.intencion', {hasText:c}).first();
  if (await b.count()) { console.log('  clic', c); await b.click(); await page.waitForTimeout(6000); } else console.log('  NO chip', c);
}
console.log('msgs:', JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('.msg')).map(m=>m.className+' :: '+(m.textContent||'').trim().slice(0,70))), null, 1));
await page.screenshot({path:SP+'v05-en.png'});
await browser.close();
