import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const chip = process.argv[2];
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('request', r => { if (r.url().includes('/api/')) console.log(`  REQ ${r.method()} ${r.url().split('/').slice(-1)[0]}`); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await page.waitForTimeout(4000);
const snap = () => page.evaluate(() => ({
  t: +window.__tutoria.media.currentTime().toFixed(2),
  paused: window.__tutoria.media.paused(),
  rate: (document.querySelector('audio')||{}).playbackRate,
  dock: window.__tutoria.dock && window.__tutoria.dock.actual,
  estado: JSON.stringify(window.__tutoria.estado()).slice(0,200),
  msgs: Array.from(document.querySelectorAll('.msg')).map(m=>m.className+' :: '+(m.textContent||'').trim().slice(0,60)),
  dockTxt: (document.querySelector('.dock')?.textContent||'').replace(/\s+/g,' ').trim().slice(0,300),
  aria: (document.querySelector('[aria-live]')?.textContent||'').trim().slice(0,120),
}));
console.log('ANTES', JSON.stringify(await snap(), null, 1));
await page.locator('.dock button.intencion', {hasText: chip}).first().click();
await page.waitForTimeout(8000);
console.log('DESPUES', JSON.stringify(await snap(), null, 1));
await page.screenshot({path:SP+'v03-'+chip.replace(/[^a-z]/gi,'')+'.png'});
await browser.close();
