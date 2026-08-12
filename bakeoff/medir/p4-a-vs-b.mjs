import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('requestfailed', r => console.log('  REQ FAILED:', r.url(), r.failure()&&r.failure().errorText));
for (const v of ['A','B']) {
  const u = `http://localhost:57330/?lang=es&variant=${v}&t=80`;
  await page.goto(u, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(2500);
  const o = await page.evaluate(`(()=>{
    const a=document.querySelector('audio'); const vd=document.querySelector('video');
    return {t:+window.__tutoria.media.currentTime().toFixed(2), dur:+window.__tutoria.media.duration().toFixed(1),
      paused:window.__tutoria.media.paused(), owns:window.__tutoria.media.ownsStage,
      audio: a? {src:a.currentSrc.slice(-40), rs:a.readyState, ct:+a.currentTime.toFixed(2), err:a.error&&a.error.code}:null,
      video: vd? {src:vd.currentSrc.slice(-40), rs:vd.readyState}:null,
      estadoKeys: Object.keys(window.__tutoria.estado()||{})};
  })()`);
  console.log('variant', v, JSON.stringify(o));
  // now press play and advance
  await page.evaluate('window.__tutoria.media.play()');
  await page.waitForTimeout(3000);
  const o2 = await page.evaluate(`({t:+window.__tutoria.media.currentTime().toFixed(2), paused:window.__tutoria.media.paused(), q: !!document.querySelector('.q')})`);
  console.log('   after play 3s', JSON.stringify(o2));
}
await browser.close();
