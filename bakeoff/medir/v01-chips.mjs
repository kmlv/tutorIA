import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const reqs = [];
page.on('request', r => { if (r.url().includes('/api/')) reqs.push({t: Date.now(), m: r.method(), u: r.url().replace('http://localhost:57330','')}); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('cargado. duracion=', await page.evaluate('window.__tutoria.media.duration()'));

// paso 2
await page.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await page.waitForTimeout(4000);
console.log('t=', await page.evaluate('window.__tutoria.media.currentTime()'), 'paused=', await page.evaluate('window.__tutoria.media.paused()'));
console.log('dock=', JSON.stringify(await page.evaluate('window.__tutoria.dock && window.__tutoria.dock.actual')).slice(0,400));

// que hay en el dock?
const dockHtml = await page.evaluate(() => { const d=document.querySelector('.dock'); return d? d.innerHTML : 'NO DOCK'; });
fs.writeFileSync('/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/dock1.html', dockHtml);
console.log('dock html len', dockHtml.length);
// listar botones visibles del dock
const botones = await page.evaluate(() => Array.from(document.querySelectorAll('.dock button, .dock [role=button]')).map(b=>({cls:b.className, txt:(b.textContent||'').trim().slice(0,40)})));
console.log('BOTONES DOCK:', JSON.stringify(botones, null, 1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/v01-a.png'});
await browser.close();
