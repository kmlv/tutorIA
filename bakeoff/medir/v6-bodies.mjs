import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const bodies=[];
page.on('response', async r => { if(r.url().includes('/next')) { try{ bodies.push(await r.text()); }catch(e){} } });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(`__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();`);
await page.waitForSelector('.q', {timeout:40000});
await page.waitForTimeout(1200);
await page.getByRole('button', {name:'Se vuelve más plana', exact:true}).first().click();
await page.waitForFunction(`document.querySelectorAll('.q-manip').length > 0`, null, {timeout:25000});
await page.waitForTimeout(1500);
for (let i=1;i<=4;i++){
  const ok = await page.evaluate(() => { const ms=[...document.querySelectorAll('.q-manip')]; const l=ms[ms.length-1]; const b=[...l.querySelectorAll('button')].find(x=>/listo/i.test(x.textContent)); if(!b||b.disabled) return 'no'; b.click(); return 'clic';});
  await page.waitForTimeout(1500);
}
bodies.forEach((b,i)=>console.log('/next #'+i+':', b.slice(0,400)));
await browser.close();
