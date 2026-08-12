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

const dump = async (label) => {
  const info = await page.evaluate(() => {
    const el = document.getElementById('desfase');
    if (!el) return {existe:false};
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {existe:true, texto: el.textContent, title: el.getAttribute('title'),
      display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
      fontSize: cs.fontSize, color: cs.color,
      rect: {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)},
      t: window.__tutoria.media.currentTime().toFixed(1),
      paused: window.__tutoria.media.paused()};
  });
  console.log(label, JSON.stringify(info));
};

await dump('ANTES de pulsar Empezar:');

// orden en la barra
const orden = await page.evaluate(() => Array.from(document.querySelectorAll('.controles > *'))
  .map(e => `${e.tagName.toLowerCase()}#${e.id||''}.${e.className}="${(e.textContent||'').trim().slice(0,20)}"`));
console.log('ORDEN barra:', JSON.stringify(orden, null, 1));

await page.click('#play');
for (const s of [1500, 3000, 5000, 8000, 12000]) {
  await page.waitForTimeout(s === 1500 ? 1500 : 2500);
  await dump(`t≈ tras ${s}ms:`);
}
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/barra-es.png'});
// recorte de la barra
const bar = await page.$('.controles');
if (bar) await bar.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/controles-es.png'});
await browser.close();
