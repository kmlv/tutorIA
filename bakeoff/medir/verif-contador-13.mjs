import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const LANG = process.argv[2] || 'es';
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto(`http://localhost:57330/?lang=${LANG}`, {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#ask');
await page.waitForSelector('.composer-input', {timeout:10000});

const snap = () => page.evaluate(() => {
  const c = document.querySelector('.composer-restantes');
  const f = document.querySelector('.composer');
  const b = document.querySelector('.composer-enviar');
  const burbujas = [...document.querySelectorAll('.dock *')]
    .filter(n=>n.children.length===0 && n.textContent.trim())
    .slice(-3).map(n=>n.textContent.trim().slice(0,140));
  return {
    contadorHTML: c ? c.outerHTML : null,
    aria: c ? (c.getAttribute('aria-label')||c.getAttribute('title')||null) : null,
    agotado: f ? f.dataset.agotado : null,
    btn: b ? {txt:b.textContent.trim(), dis:b.disabled,
              op:getComputedStyle(b).opacity, pe:getComputedStyle(b).pointerEvents} : null,
    ultimas: burbujas,
  };
});

for (let i = 1; i <= 13; i++) {
  await page.fill('.composer-input', `pregunta numero ${i}: por que la recta baja?`);
  await page.click('.composer-enviar');
  await page.waitForFunction(() => {
    const b = document.querySelector('.composer-enviar');
    return b && !b.disabled;
  }, null, {timeout:120000}).catch(()=>console.log('  (boton no volvio)'));
  await page.waitForTimeout(300);
  if (i >= 11) console.log(`ask #${i}`, JSON.stringify(await snap(), null, 1));
  if (i === 12) {
    const el = await page.$('.composer');
    if (el) await el.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-composer12-${LANG}.png`});
  }
}
const el = await page.$('.composer');
if (el) await el.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-composer13-${LANG}.png`});
await page.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-full13-${LANG}.png`});
await browser.close();
