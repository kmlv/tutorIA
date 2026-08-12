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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const snap = async (etiqueta) => {
  const s = await page.evaluate(`(()=>{
    const t = window.__tutoria.media.currentTime();
    const p = window.__tutoria.media.paused();
    const relojEl = [...document.querySelectorAll('*')].find(e=>/^\\d+:\\d\\d$/.test(e.textContent.trim()) && e.children.length===0);
    const play = document.querySelector('#play');
    const esc = document.querySelector('.escenario');
    return {
      t: +t.toFixed(2), paused: p,
      reloj: relojEl ? relojEl.textContent.trim() : null,
      playTxt: play ? play.innerText.trim() : null,
      escenarioLen: esc ? esc.innerText.trim().length : null,
      escenarioTxt: esc ? esc.innerText.trim().slice(0,120) : null,
      lienzoNodos: document.querySelectorAll('.lienzo *').length,
      url: location.href,
    };
  })()`);
  console.log(etiqueta, JSON.stringify(s));
  return s;
};

await page.click('#play');
await page.waitForFunction('window.__tutoria.media.currentTime() >= 19', null, {timeout:60000});
await snap('ANTES (t=19):');
await page.screenshot({path:'vi-A-antes.png'});

await Promise.all([
  page.waitForNavigation({waitUntil:'domcontentloaded'}),
  page.click('a:has-text("English")'),
]);
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(800);
await snap('DESPUES (tras English):');
await page.screenshot({path:'vi-A-despues.png'});

await browser.close();
