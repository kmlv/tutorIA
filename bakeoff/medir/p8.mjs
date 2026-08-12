import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/shots';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
const posts=[];
page.on('request', r=>{ if(r.method()==='POST') posts.push(r.url().replace('http://localhost:57330','')); });
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
await page.click('#play'); await page.waitForTimeout(2000);
await page.click('#ask'); await page.waitForTimeout(600);
for(const chip of ['No entiendo','Otro ejemplo','Más despacio','¿Por qué?']){
  posts.length=0;
  const antes = await page.evaluate(()=>document.querySelector('.dock').innerText);
  await page.click(`.dock >> text=${chip}`);
  await page.waitForTimeout(8000);
  const desp = await page.evaluate(()=>document.querySelector('.dock').innerText);
  console.log(`CHIP "${chip}": POSTs=${JSON.stringify(posts)} cambio=${desp!==antes}`);
  console.log('   dock ahora:', desp.split('\n').filter(x=>x.trim()).join(' | ').slice(0,300));
  console.log('   contador:', JSON.stringify(await page.evaluate(()=>document.querySelector('.composer-restantes')?.innerText)));
}
await page.screenshot({path:OUT+'/p8-chips.png'});
// html del chip
console.log('HTML de un chip:', await page.evaluate(()=>{const b=[...document.querySelectorAll('.dock button')].find(x=>x.innerText.includes('No entiendo')); return b.outerHTML.slice(0,300)+' || padre: '+b.parentElement.className;}));
await browser.close();
