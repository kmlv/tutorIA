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
const N = +(process.argv[3] || 12);

const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto(`http://localhost:57330/?lang=${LANG}`, {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const cont = () => page.evaluate(() => {
  const c = document.querySelector('.composer-restantes');
  const f = document.querySelector('.composer');
  const b = document.querySelector('.composer-enviar');
  if (!c) return null;
  const cs = b ? getComputedStyle(b) : null;
  const fs2 = f ? getComputedStyle(f) : null;
  return {
    contador: JSON.stringify(c.textContent),
    agotado: f ? JSON.stringify(f.dataset.agotado) : null,
    botonTexto: b ? b.textContent.trim() : null,
    botonDisabled: b ? b.disabled : null,
    botonOpacity: cs ? cs.opacity : null,
    botonPointer: cs ? cs.pointerEvents : null,
    botonBg: cs ? cs.backgroundColor : null,
  };
});

console.log('== antes de pulsar Preguntar ==', JSON.stringify(await cont()));

// abrir el composer
await page.click('#ask');
await page.waitForSelector('.composer-input', {timeout:10000});
console.log('== composer abierto, sin preguntar ==', JSON.stringify(await cont()));

for (let i = 1; i <= N; i++) {
  await page.fill('.composer-input', `pregunta numero ${i}: por que la recta baja?`);
  await page.click('.composer-enviar');
  // esperar a que el boton vuelva de "…"
  await page.waitForFunction(() => {
    const b = document.querySelector('.composer-enviar');
    return b && !b.disabled;
  }, null, {timeout:120000});
  await page.waitForTimeout(250);
  const c = await cont();
  console.log(`ask #${i}`, JSON.stringify(c));
}

await page.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-contador-${LANG}.png`});
// recorte del composer
const el = await page.$('.composer');
if (el) await el.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-composer-${LANG}.png`});
await browser.close();
