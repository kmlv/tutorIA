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
const net = [];
page.on('request', r => { if (r.url().includes('/api/')||r.url().includes('/chat')) net.push({t:Date.now(), m:r.method(), u:r.url().replace('http://localhost:57330',''), b:(r.postData()||'').slice(0,200)}); });
page.on('response', async r => { if (r.url().includes('/api/')||r.url().includes('/chat')) { net.push({t:Date.now(), m:'<<'+r.status(), u:r.url().replace('http://localhost:57330','')}); } });

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('duracion:', await page.evaluate('__tutoria.media.duration()'));

await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForTimeout(6000);

// esperar a que aparezca la pregunta
try { await page.waitForSelector('.q', {timeout:20000}); } catch(e){ console.log('NO .q'); }
console.log('--- DOM de la pregunta ---');
console.log((await page.evaluate(() => document.querySelector('.q')?.outerHTML || 'NADA')).slice(0,2500));
console.log('--- DOM del dock ---');
console.log((await page.evaluate(() => document.querySelector('.dock')?.outerHTML || 'NADA')).slice(0,4000));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-int-1.png'});
console.log('--- red hasta ahora ---'); net.forEach(x=>console.log(' ', x.m, x.u, x.b||''));
await browser.close();
