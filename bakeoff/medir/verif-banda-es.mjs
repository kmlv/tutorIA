import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

async function mira(url, tag){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const b = document.querySelector('.bands');
    const vis = el => { if(!el) return null; const r = el.getBoundingClientRect(); const s=getComputedStyle(el);
      return {w:Math.round(r.width),h:Math.round(r.height),op:s.opacity,disp:s.display,vis:s.visibility}; };
    return {
      t: window.__tutoria.media.currentTime(),
      lang: document.documentElement.lang,
      url: location.href,
      bandsText: b ? b.innerText : '(no .bands)',
      bandsRect: vis(b),
      hijos: b ? [...b.children].map(c=>({cls:c.className, txt:c.innerText, ...vis(c)})) : []
    };
  });
  console.log('=== ' + tag + ' ===');
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-${tag}.png`});
  const bb = await page.$('.bands');
  if (bb) await bb.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-${tag}-banda.png`}).catch(()=>{});
  return {page, ctx};
}

await mira('http://localhost:57330/?lang=es&t=160','es-160');
await mira('http://localhost:57330/?lang=es&t=180','es-180');
await mira('http://localhost:57330/?lang=en&t=160','en-160');
await mira('http://localhost:57330/?lang=en&t=180','en-180');
await browser.close();
