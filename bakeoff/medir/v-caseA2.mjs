import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const texto = process.argv[2] || 'cualquier cosa';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => { window.__tutoria.media.seek(193.5); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() === true', null, {timeout:20000}).catch(()=>console.log('  no pauso'));
await page.waitForTimeout(500);
const msgSel = '.dock .msg, .dock .mensaje, .dock [class*="msg"], .dock [class*="burbuja"], .dock p';
const dump = async(tag)=>{
  const r = await page.evaluate((sel)=>{
    const nodes=[...document.querySelectorAll(sel)];
    return {t:+window.__tutoria.media.currentTime().toFixed(2), p:window.__tutoria.media.paused(),
      msgs:nodes.map(n=>n.className+' >> '+n.innerText.trim().replace(/\n+/g,' / ')).filter(x=>x.split('>>')[1].trim())};
  }, msgSel);
  console.log(`--- ${tag} t=${r.t} paused=${r.p}`);
  r.msgs.slice(-6).forEach(m=>console.log('    '+m.slice(0,400)));
  return r;
};
await dump('checkpoint');
console.log(`\n>>> escribo "${texto}" y pulso Responder`);
await page.fill('.composer-input', texto);
await page.click('.composer-enviar');
await page.waitForTimeout(1500); await dump('+1.5s');
await page.waitForTimeout(8500); await dump('+10s');
await page.waitForTimeout(20000); await dump('+30s');
await browser.close();
