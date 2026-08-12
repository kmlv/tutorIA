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
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const snap = async (label) => {
  const s = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    const esc = document.querySelector('.escenario');
    const r = dock ? dock.getBoundingClientRect() : null;
    const re = esc ? esc.getBoundingClientRect() : null;
    const head = dock ? dock.querySelector('header, .dock-cabecera, .dock-header') : null;
    return {
      dockActual: window.__tutoria.dock ? window.__tutoria.dock.actual : null,
      paused: window.__tutoria.media.paused(),
      t: +window.__tutoria.media.currentTime().toFixed(2),
      dockX: r ? Math.round(r.x) : null, dockW: r ? Math.round(r.width) : null,
      escX: re ? Math.round(re.x) : null, escW: re ? Math.round(re.width) : null,
      dockClass: dock ? dock.className : null,
      headText: head ? head.textContent.trim().slice(0,120) : null,
      headBtns: head ? [...head.querySelectorAll('button,[role=button]')].map(b=>(b.textContent||'').trim()||b.getAttribute('aria-label')) : null,
      dockBtns: dock ? [...dock.querySelectorAll('button')].filter(b=>b.offsetParent!==null).map(b=>(b.textContent||'').trim().slice(0,40)) : null,
      playLabel: (document.querySelector('#play')||{}).textContent,
      askLabel: (document.querySelector('#ask')||{}).textContent,
    };
  });
  console.log(label, JSON.stringify(s, null, 0));
  return s;
};

await page.click('#play');            // Empezar
await page.waitForTimeout(1500);
console.log('=== paso 1 hecho (Empezar +1.5s) ===');
await snap('P1:');

await page.click('#ask');             // 1er clic
await page.waitForTimeout(600);
await snap('P2 (1er clic ask):');

await page.click('#ask');             // 2o clic
await page.waitForTimeout(600);
await snap('P3 (2o clic ask):');

await page.click('#ask');             // 3er clic
await page.waitForTimeout(600);
await snap('P4 (3er clic ask):');

await page.keyboard.press('Escape');
await page.waitForTimeout(600);
await snap('P5 (Escape):');

// Escape con foco en el body explicitamente
await page.evaluate(()=>document.body.focus());
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await snap('P5b (Escape con body):');

// HTML de la cabecera del dock
const headHTML = await page.evaluate(()=>{
  const dock = document.querySelector('.dock');
  return dock ? dock.outerHTML.slice(0, 2500) : null;
});
console.log('\n--- DOCK HTML (2500) ---\n' + headHTML);

await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/ask-abierto.png'});
await browser.close();
