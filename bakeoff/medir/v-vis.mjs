import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() === true', null, {timeout:20000});
await page.waitForTimeout(400);
await page.click('.q-opciones button:nth-of-type(1)');
await page.waitForTimeout(6000);
await page.evaluate(()=>{ [...document.querySelectorAll('.dock-acciones button')].find(b=>/Listo/.test(b.innerText)).click(); });
for (const ms of [100,400,900,1600,3000]) {
  await page.waitForTimeout(ms===100?100:ms-100);
  const v = await page.evaluate(()=>{
    const dock=document.querySelector('.dock'); const cs=getComputedStyle(dock); const r=dock.getBoundingClientRect();
    const msg=[...document.querySelectorAll('.dock .msg')].find(n=>/Cuando quieras/.test(n.innerText));
    const mr=msg?msg.getBoundingClientRect():null;
    return {estado:dock.dataset.estado, op:cs.opacity, vis:cs.visibility, disp:cs.display, tr:cs.transform,
      dockRect:{y:Math.round(r.y),h:Math.round(r.height)}, hayMsg:!!msg, msgRect:mr?{y:Math.round(mr.y),h:Math.round(mr.height)}:null};
  });
  console.log(`+${ms}ms `, JSON.stringify(v));
}
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v-vis.png'});
await browser.close();
