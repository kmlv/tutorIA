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
const t0 = Date.now();
await page.goto('http://localhost:57330/?lang=es&t=144', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('duration lista tras', Date.now()-t0, 'ms; duration =',
  await page.evaluate('window.__tutoria.media.duration()'));
// lecturas cada 0.4 s
for (let i=1;i<=6;i++){
  await page.waitForTimeout(400);
  const r = await page.evaluate(`({ct: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(), href: location.href})`);
  console.log(`  t+${(i*0.4).toFixed(1)}s  currentTime=${r.ct.toFixed(2)}  paused=${r.paused}`);
}
await page.waitForTimeout(4000);
const after = await page.evaluate(`({ct: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(), href: location.href, owns: window.__tutoria.media.ownsStage})`);
console.log('tras 4 s mas:', JSON.stringify(after));
// pulsar play
const playSel = '#play';
const hasPlay = await page.$(playSel);
console.log('boton #play existe:', !!hasPlay);
if (hasPlay) await page.click(playSel);
await page.waitForTimeout(1500);
const p = await page.evaluate(`({ct: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused()})`);
console.log('1.5 s tras pulsar play:', JSON.stringify(p));
await page.waitForTimeout(1500);
const p2 = await page.evaluate(`({ct: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused()})`);
console.log('3.0 s tras pulsar play:', JSON.stringify(p2));
await browser.close();
