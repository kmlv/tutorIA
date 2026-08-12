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
page.on('request', r => { if (/ask|pregunt|chat|tutor/i.test(r.url())) reqs.push(r.method()+' '+r.url()); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('cargado. duration=', await page.evaluate('window.__tutoria.media.duration()'));

// Recon: que hay en pantalla
console.log('#ask existe:', await page.locator('#ask').count());
console.log('#ask texto:', await page.locator('#ask').first().textContent().catch(()=>'n/a'));
console.log('dock estado:', JSON.stringify(await page.evaluate('window.__tutoria.dock && window.__tutoria.dock.actual')));

await page.locator('#ask').first().click();
await page.waitForTimeout(800);
console.log('--- tras pulsar Preguntar ---');
console.log('dock estado:', JSON.stringify(await page.evaluate('window.__tutoria.dock && window.__tutoria.dock.actual')));
console.log('composer-input count:', await page.locator('.composer-input').count());
const dockHtml = await page.evaluate(`(()=>{const d=document.querySelector('.dock'); return d? d.outerHTML.slice(0,3000):'NO DOCK';})()`);
console.log('DOCK HTML:\n', dockHtml);
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/recon.png'});
await browser.close();
