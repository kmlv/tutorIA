import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
for (const lang of ['es','en']) {
  const page = await ctx.newPage();
  await page.goto(`http://localhost:57330/?lang=${lang}`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  const r = await page.evaluate(()=>{
    const m = window.__tutoriaSesion.media, tr = m.transcript;
    const at = t => { let c=-1; tr.forEach((s,i)=>{ if(s.start_s<=t) c=i; }); return c>=0 && t<=tr[c].end_s ? {i:c, ...tr[c]} : null; };
    return m.cues.filter(c=>c.type!=='graph').map(c=>({cue:c.id, type:c.type, t:c.t, coincideConInicio: tr.some(s=>Math.abs(s.start_s-c.t)<0.001), segmento: at(c.t)}));
  });
  console.log('### ' + lang.toUpperCase());
  for (const x of r) console.log(` ${x.cue} (${x.type}) t=${x.t}  start==cue: ${x.coincideConInicio}  -> "${x.segmento?.text}"`);
  await page.close();
}
await browser.close();
