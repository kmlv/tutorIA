import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const T0=Date.now(); const ms=()=>((Date.now()-T0)/1000).toFixed(1);
page.on('request', r => { const u=r.url(); if (u.includes('/api/')) console.log(`  [${ms()}s] -> ${r.method()} ${u.replace('http://localhost:57330','')} ${(r.postData()||'').slice(0,180)}`); });
const dock = async () => await page.evaluate(() => Array.from(document.querySelectorAll('.dock-body > *')).map(e => e.className+' :: '+(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,110)));

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('CUES checkpoint:', JSON.stringify(await page.evaluate(() => (window.__tutoriaSesion.media.cues||[]).filter(c=>/check|pausa|cp/i.test(c.type||'')).map(c=>({t:c.t,type:c.type,id:c.id})))));
console.log('tipos de cue:', JSON.stringify(await page.evaluate(() => [...new Set((window.__tutoriaSesion.media.cues||[]).map(c=>c.type))])));

// --- checkpoint: dejar correr hasta que la media se pause sola
const cps = await page.evaluate(() => (window.__tutoriaSesion.media.cues||[]).filter(c=>c.type==='checkpoint').map(c=>c.t));
console.log('checkpoints en t=', cps);
if (cps.length) {
  const t = cps[0];
  console.log(`\n########## CHECKPOINT en t=${t}`);
  await page.evaluate(t => { __tutoria.media.seek(t-2); __tutoria.media.play(); }, t);
  await page.waitForFunction('__tutoria.media.paused()', null, {timeout:20000}).catch(()=>console.log('  no se pauso solo'));
  console.log('  media pausada en', await page.evaluate('__tutoria.media.currentTime()'), 'dock:', await page.evaluate('__tutoria.dock.actual'));
  console.log('  dock:'); console.log((await dock()).join('\n'));
  await page.evaluate(() => { const b=Array.from(document.querySelectorAll('.dock-acciones .intencion')).find(x=>x.textContent.trim()==='No entiendo'); b&&b.click(); });
  await page.waitForTimeout(12000);
  console.log('  --- tras clic "No entiendo" + 12s: paused=', await page.evaluate('__tutoria.media.paused()'), 't=', await page.evaluate('__tutoria.media.currentTime()'), 'dock=', await page.evaluate('__tutoria.dock.actual'));
  console.log((await dock()).join('\n'));
  await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-int-cp.png'});
}
await browser.close();
