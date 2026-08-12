import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

async function probe(url, label) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0,300)));
  page.on('console', m => { if (m.type()==='error') errs.push('CONSOLE.ERR: ' + m.text().slice(0,300)); });
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(4000);
  const st = await page.evaluate(() => ({
    hasHook: typeof window.__tutoria !== 'undefined',
    dur: (window.__tutoria && window.__tutoria.media) ? window.__tutoria.media.duration() : null,
    t: (window.__tutoria && window.__tutoria.media) ? window.__tutoria.media.currentTime() : null,
    playText: document.querySelector('#play') ? document.querySelector('#play').textContent.trim() : null,
    playDisabled: document.querySelector('#play') ? document.querySelector('#play').disabled : null,
    reloj: (document.body.innerText.match(/\d+:\d\d/g)||[]).slice(0,3),
    bodyLen: document.body.innerText.length,
    bodyHead: document.body.innerText.slice(0,260).replace(/\n+/g,' | '),
    sesionVariant: window.__tutoriaSesion ? (window.__tutoriaSesion.variant ?? window.__tutoriaSesion.media?.variant ?? 'n/a') : 'no-sesion',
  }));
  console.log('\n===== ' + label + ' =====');
  console.log(url);
  console.log(JSON.stringify(st, null, 1));
  console.log('errores:', errs.length ? errs : '(ninguno)');
  // pulsar Empezar / play
  const play = await page.$('#play');
  if (play) {
    await play.click().catch(e=>console.log('click fallo', String(e).slice(0,120)));
    await page.waitForTimeout(3000);
    const after = await page.evaluate(() => ({
      t: (window.__tutoria && window.__tutoria.media) ? window.__tutoria.media.currentTime() : null,
      paused: (window.__tutoria && window.__tutoria.media) ? window.__tutoria.media.paused() : null,
      reloj: (document.body.innerText.match(/\d+:\d\d/g)||[]).slice(0,3),
      playText: document.querySelector('#play') ? document.querySelector('#play').textContent.trim() : null,
    }));
    console.log('tras pulsar play (3s):', JSON.stringify(after));
  } else {
    console.log('NO HAY #play');
  }
  await page.screenshot({path: 'verif-' + label + '.png'});
  await ctx.close();
}

await probe('http://localhost:57330/?lang=es&variant=b', 'b-minus');
await probe('http://localhost:57330/?lang=es&variant=C', 'C-mayus');
await probe('http://localhost:57330/?lang=es&variant=B', 'B-control');
await probe('http://localhost:57330/?lang=es&variant=A', 'A-control');
await probe('http://localhost:57330/?lang=es', 'sin-variant');
await browser.close();
