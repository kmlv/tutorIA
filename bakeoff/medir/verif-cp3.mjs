import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
// Contraste limpio: MISMA socratica de line_vs_set, una vez servida por PREDICCION y otra por CHECKPOINT
for (const [etiq, tt, guardia] of [['PREDICCION line_vs_set', 85, 'la recta que la bordea'], ['CHECKPOINT cp1', 143, 'ingreso sube de 100 a 150']]) {
  for (let intento=0; intento<4; intento++) {
    const ctx = await browser.newContext({viewport:{width:1280,height:860}});
    const page = await ctx.newPage(); let net=null;
    page.on('response', async r=>{ if(r.url().includes('/answer')){ try{net=JSON.parse(await r.text());}catch(e){} }});
    await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
    await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
    await page.evaluate(`window.__tutoria.media.seek(${tt})`);
    await page.click('#play'); await page.waitForTimeout(400);
    if (Math.abs(await page.evaluate('window.__tutoria.media.currentTime()') - tt) > 6) await page.evaluate(`window.__tutoria.media.seek(${tt})`);
    await page.waitForSelector('.q', {timeout:20000}); await page.waitForTimeout(700);
    const enun = await page.$eval('.q-enunciado', e=>e.textContent.trim());
    if (!enun.includes(guardia)) { await ctx.close(); continue; }   // guardia: la pregunta correcta
    const ops = await page.$$eval('.q-opciones button', bs=>bs.map(b=>b.textContent.trim()));
    // elegir el distractor 2
    await page.click('.q-opciones button:nth-of-type(2)');
    await page.waitForTimeout(4000);
    const o = await page.evaluate(()=>({
      dockActual: window.__tutoria?.dock?.actual, paused: window.__tutoria.media.paused(),
      dockText: document.querySelector('.dock')?.innerText.replace(/\s+/g,' ').trim()||'',
    }));
    const soc = (net?.socratica||'').trim().replace(/\s+/g,' ');
    console.log(`\n### ${etiq}`);
    console.log(`  pregunta: "${enun.slice(0,70)}..."`);
    console.log(`  elegido : "${ops[1]}"`);
    console.log(`  servidor: correcta=${net?.correcta} socratica=${soc?JSON.stringify(soc.slice(0,95)):'(ninguna)'}`);
    console.log(`  pantalla: dock=${o.dockActual} audioPausado=${o.paused}`);
    console.log(`  ¿SOCRATICA PINTADA?  ${soc ? (o.dockText.includes(soc.slice(0,30)) ? 'SI' : 'NO') : 'n/a'}`);
    await ctx.close(); break;
  }
}
await browser.close();
