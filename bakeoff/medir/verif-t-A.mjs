import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

async function sonda(url, etiqueta, shot) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`  [${etiqueta}] JS ERROR:`, String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const t = window.__tutoria;
    const txt = s => { const e = document.querySelector(s); return e ? e.textContent.trim().slice(0,180) : null; };
    return {
      currentTime: t.media.currentTime(),
      duration: t.media.duration(),
      paused: t.media.paused(),
      ownsStage: t.media.ownsStage,
      relojDOM: txt('.tiempo') || txt('.reloj') || txt('.time') || txt('.controles'),
      captions: txt('.captions-band'),
      estado: (()=>{ try { return JSON.stringify(t.estado()).slice(0,600); } catch(e){ return 'ERR '+e; } })(),
      urlLang: [...document.querySelectorAll('a')].map(a=>a.getAttribute('href')).filter(h=>h&&h.includes('lang')).slice(0,3),
    };
  });
  console.log(`\n=== ${etiqueta} :: ${url}`);
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({path: shot});
  return {page, ctx, info};
}

const SCR = '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const A = await sonda('http://localhost:57330/?lang=es&variant=A&t=110', 'A t=110', SCR+'/v-A-t110.png');
const B = await sonda('http://localhost:57330/?lang=es&variant=B&t=110', 'B t=110', SCR+'/v-B-t110.png');
await browser.close();
