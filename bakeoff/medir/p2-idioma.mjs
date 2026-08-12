import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
async function info(tag){
  const o = await page.evaluate(`(()=>{
    const a=document.querySelector('.idioma');
    return {url:location.href, href:a&&a.getAttribute('href'), t:window.__tutoria.media.currentTime(), dur:window.__tutoria.media.duration(), paused:window.__tutoria.media.paused(), dock:window.__tutoria.dock.actual, owns:window.__tutoria.media.ownsStage};
  })()`);
  console.log(tag, JSON.stringify(o));
}
for (const url of ['http://localhost:57330/?lang=es&variant=B',
                   'http://localhost:57330/?lang=es&variant=B&t=100']) {
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await info('LOAD '+url+' ->');
}
// advance to 140 and re-check href
await page.evaluate('window.__tutoria.media.seek(140)');
await page.waitForTimeout(800);
await info('AFTER seek(140) ->');
await browser.close();
