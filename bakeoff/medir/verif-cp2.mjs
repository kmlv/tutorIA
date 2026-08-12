import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const [cp, tt, n] of [['cp1',143,4],['cp2',193,4]]) {
  for (let opt=1; opt<=n; opt++) {
    const ctx = await browser.newContext({viewport:{width:1280,height:860}});
    const page = await ctx.newPage(); let net=null;
    page.on('response', async r=>{ if(r.url().includes('/answer')){ try{net=JSON.parse(await r.text());}catch(e){} }});
    await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
    await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
    await page.click('#play'); await page.waitForTimeout(250);
    await page.evaluate(`window.__tutoria.media.seek(${tt})`);
    if (await page.evaluate('window.__tutoria.media.paused()')) await page.click('#play');
    await page.waitForSelector('.q', {timeout:20000}); await page.waitForTimeout(600);
    const ops = await page.$$eval('.q-opciones button', bs=>bs.map(b=>b.textContent.trim()));
    if (opt > ops.length) { await ctx.close(); continue; }
    await page.click(`.q-opciones button:nth-of-type(${opt})`);
    await page.waitForTimeout(3500);
    const o = await page.evaluate(()=>({
      dockActual: window.__tutoria?.dock?.actual, paused: window.__tutoria.media.paused(),
      dockText: document.querySelector('.dock')?.innerText.replace(/\s+/g,' ').trim()||'',
    }));
    const extra = o.dockText.split(ops[ops.length-1]).pop().trim().split(/No entiendo|Preguntar/)[0].trim();
    console.log(`[${cp}] op${opt} "${ops[opt-1].slice(0,42)}" -> correcta=${net?.correcta} soc=${net?.socratica?JSON.stringify(net.socratica.trim().slice(0,70)):'(ninguna)'} | dock=${o.dockActual} pausado=${o.paused} | REACCION EN PANTALLA: ${extra?JSON.stringify(extra.slice(0,90)):'(NINGUNA)'}`);
    await ctx.close();
  }
}
await browser.close();
