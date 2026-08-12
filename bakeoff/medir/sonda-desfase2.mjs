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

for (const lang of ['en','es']) {
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(`http://localhost:57330/?lang=${lang}&t=0`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  console.log(`\n=== lang=${lang} ===`);
  const btn = await page.textContent('#play');
  console.log('boton play:', JSON.stringify(btn));
  await page.click('#play');
  const seen = new Set();
  for (let i=0;i<24;i++){
    await page.waitForTimeout(2000);
    const s = await page.evaluate(()=>({txt:document.getElementById('desfase').textContent,
      t:+window.__tutoria.media.currentTime().toFixed(1), p:window.__tutoria.media.paused()}));
    if(!seen.has(s.txt)){ seen.add(s.txt); console.log(`  t=${s.t} paused=${s.p} desfase="${s.txt}"`); }
    if(s.p) { console.log(`  (pausado en t=${s.t}, desfase="${s.txt}") -> reanudo`); await page.click('#play').catch(()=>{}); }
  }
  console.log('valores distintos vistos:', JSON.stringify([...seen]));
  if(lang==='en'){ const bar=await page.$('.controles'); await bar.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/controles-en.png'}); }
  await page.close();
}
await browser.close();
