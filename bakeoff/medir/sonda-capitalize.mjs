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
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.card-name').forEach(el => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    out.push({
      textContent: el.textContent,
      innerHTML: el.innerHTML.slice(0,200),
      textTransform: cs.textTransform,
      fontVariant: cs.fontVariantCaps,
      visible: r.width>0 && r.height>0,
      rect: {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)},
      display: cs.display,
      cls: el.className,
      parentCls: el.parentElement ? el.parentElement.className : null,
    });
  });
  return out;
});
console.log('CARD-NAME nodes:', JSON.stringify(info, null, 2));

// Buscar cualquier nodo que contenga "naranja" o "Naranja"
const hits = await page.evaluate(() => {
  const res = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while (n = walk.nextNode()) {
    if (/naranja/i.test(n.nodeValue)) {
      const el = n.parentElement;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      res.push({raw: n.nodeValue, tag: el.tagName, cls: el.className,
        textTransform: cs.textTransform, fontVariantCaps: cs.fontVariantCaps,
        visible: r.width>0 && r.height>0, rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}});
    }
  }
  return res;
});
console.log('NARANJA text nodes:', JSON.stringify(hits, null, 2));

await page.screenshot({path: '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/t0-full.png'});
await browser.close();
