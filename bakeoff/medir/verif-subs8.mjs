import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});

// --- A) ES con subtitulos OCULTOS antes de llegar
{
  const page = await ctx.newPage();
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.click('.caption-toggle');
  console.log('A) tras pulsar toggle ->', await page.$eval('.caption-toggle', n=>n.textContent.trim()+' aria='+n.getAttribute('aria-pressed')));
  await page.click('#play');
  await page.evaluate(()=>window.__tutoria.media.seek(85));
  await page.evaluate(()=>window.__tutoria.media.play());
  await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
  await page.waitForTimeout(600);
  const r = await page.evaluate(()=>{
    const c = document.querySelector('.caption-current');
    return {t: window.__tutoria.media.currentTime(), existe: !!c, visible: c? c.offsetParent!==null : false,
            texto: c? c.textContent.trim() : null, bandaTexto: document.querySelector('.caption-bar')?.innerText?.trim()};
  });
  console.log('A) ES con subtitulos ocultos:', JSON.stringify(r,null,1));
  await page.screenshot({path: SP+'A-es-ocultos.png'});
  await page.close();
}

// --- B) EN
{
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  const cues = await page.evaluate(()=> window.__tutoriaSesion.media.cues.filter(c=>c.type!=='graph').map(c=>({t:c.t,id:c.id,type:c.type})));
  console.log('B) cues EN:', JSON.stringify(cues));
  console.log('B) toggle:', await page.$eval('.caption-toggle', n=>n.textContent.trim()+' aria='+n.getAttribute('aria-pressed')));
  await page.click('#play');
  for (const c of cues.filter(x=>x.type==='prediction')) {
    await page.evaluate(t => window.__tutoria.media.seek(t-2.5), c.t);
    await page.evaluate(()=>window.__tutoria.media.play());
    await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
    await page.waitForTimeout(600);
    const r = await page.evaluate(()=>{
      const qs = [...document.querySelectorAll('.q')];
      const last = qs[qs.length-1];
      return {t: window.__tutoria.media.currentTime(),
        caption: document.querySelector('.caption-current')?.textContent?.trim(),
        enunciado: last?.querySelector('.q-enunciado')?.textContent?.trim(),
        opciones: last? [...last.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim()) : []};
    });
    console.log('B) EN ' + c.id + ':', JSON.stringify(r,null,1));
    await page.screenshot({path: SP+`B-en-${c.id}.png`});
  }
  await page.close();
}
await browser.close();
