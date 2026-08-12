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
const net = [];
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('request', r => { const u=r.url(); if(u.includes('/api/')) net.push({m:r.method(), u:u.replace('http://localhost:57330',''), body:r.postData()?.slice(0,300)}); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const dur = await page.evaluate('__tutoria.media.duration()');
console.log('duracion', dur);
await page.evaluate(`__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();`);
// esperar a que aparezca una pregunta
await page.waitForSelector('.q', {timeout:40000});
await page.waitForTimeout(1500);
const dump = async (tag) => {
  const info = await page.evaluate(() => ({
    q: document.querySelector('.q-enunciado')?.textContent?.trim(),
    ops: [...document.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim()),
    manip: !!document.querySelector('.q-manip'),
    manipHTML: document.querySelector('.q-manip')?.innerHTML?.slice(0,600),
    dock: document.querySelector('.dock')?.innerText?.slice(0,600),
    dockState: JSON.stringify(window.__tutoria?.dock?.actual)?.slice(0,600),
  }));
  console.log('=== '+tag+' ===');
  console.log(JSON.stringify(info, null, 1));
};
await dump('primera pregunta');
console.log('NET', JSON.stringify(net, null, 1));
fs.writeFileSync('/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/v1.json', JSON.stringify(net,null,1));
await page.screenshot({path:'v1-primera.png'});
await browser.close();
