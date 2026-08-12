import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('dialog', async dl => { console.log('  DIALOG:', dl.type(), dl.message()); await dl.dismiss(); });

const S = async (tag) => {
  const o = await page.evaluate(`(()=>{
    const q=document.querySelector('.q');
    return {url:location.search, t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(),
      dock:window.__tutoria.dock.actual, sess:window.__tutoriaSesion.session_id,
      idiomaHref:(document.querySelector('.idioma')||{}).getAttribute? document.querySelector('.idioma').getAttribute('href'):null,
      q: q? {enun:(q.querySelector('.q-enunciado')||{}).textContent, n:q.querySelectorAll('.q-opciones button').length}:null,
      dockText:((document.querySelector('.dock')||{}).innerText||'').replace(/\\n/g,' | ').slice(0,300)};
  })()`);
  console.log(tag, JSON.stringify(o));
  return o;
};
await page.goto('http://localhost:57330/?lang=es&variant=B', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await S('load          ');
// jump to just before first prediction (87.045)
await page.evaluate('window.__tutoria.media.seek(84)');
await page.waitForTimeout(400);
await page.evaluate('window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:20000});
await page.waitForTimeout(600);
const q1 = await S('prediccion 87 ');
// answer first option
await page.click('.q-opciones button');
await page.waitForTimeout(1500);
await S('tras responder');
// resume if paused
if (await page.evaluate('window.__tutoria.media.paused()')) {
  await page.evaluate('window.__tutoria.media.play()');
}
// jump close to cp1 (144.761)
await page.evaluate('window.__tutoria.media.seek(142)');
await page.evaluate('window.__tutoria.media.play()');
await page.waitForTimeout(6000);
await S('cerca cp1     ');
console.log('  HTML .q:', (await page.evaluate(`(document.querySelector('.q')||{}).outerHTML||'(none)'`)).slice(0,600));
console.log('  DOCK HTML:', (await page.evaluate(`(document.querySelector('.dock')||{}).outerHTML||''`)).slice(0,900));
await browser.close();
