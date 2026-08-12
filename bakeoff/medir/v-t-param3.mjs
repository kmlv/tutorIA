import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

const snap = `(() => {
  const cap = document.querySelector('.captions-band');
  return {
    ct: +window.__tutoria.media.currentTime().toFixed(2),
    owns: window.__tutoria.media.ownsStage,
    mostrar: window.__tutoria.estado().mostrar,
    destacar: window.__tutoria.estado().destacar,
    caption: cap ? cap.innerText.split('\\n')[0].slice(0,60) : null
  };
})()`;

async function run(url, label) {
  console.log('===== ' + label + ' :: ' + url);
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(2500);
  console.log('  ANTES de play :', JSON.stringify(await page.evaluate(snap)));
  await page.screenshot({path:`vt-${label}-antes.png`});
  await page.click('#play');
  for (const ms of [800, 2000, 4000]) {
    await page.waitForTimeout(ms===800?800:ms-(ms===2000?800:2000));
    console.log(`  +${ms}ms tras play:`, JSON.stringify(await page.evaluate(snap)));
  }
  await page.screenshot({path:`vt-${label}-despues.png`});
  await ctx.close();
}

await run('http://localhost:57330/?lang=es&t=144', 'A-t144');
await run('http://localhost:57330/?lang=es&variant=B&t=144', 'B-t144');
await browser.close();
