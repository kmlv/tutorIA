import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');

const medir = (page) => page.evaluate(() => {
  const bs = [...document.querySelectorAll('.q .q-opciones button')];
  const clave = b => { const cs = getComputedStyle(b);
    return [cs.backgroundColor,cs.borderColor,cs.color,cs.boxShadow,cs.opacity,cs.fontWeight].join('|'); };
  const ks = bs.map(clave);
  return { clases: bs.map(b=>b.className), borde: bs.map(b=>getComputedStyle(b).borderColor),
           identicas: ks.every(k=>k===ks[0]) };
});

async function corrida(modo, indice, etiqueta) {
  const browser = await chromium.launch({executablePath: exe,
    args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
  await page.waitForSelector('.q', {timeout:20000});
  await page.waitForTimeout(1200);

  console.log('\n===== ' + etiqueta + ' =====');
  const opts = await page.$$('.q-opciones button');
  await opts[indice].click();
  await page.waitForTimeout(2500);
  console.log('  CON el raton encima del boton pulsado :', JSON.stringify(await medir(page)));
  // apartar el raton fuera del dock
  await page.mouse.move(400, 700);
  await page.waitForTimeout(600);
  const fuera = await medir(page);
  console.log('  CON el raton APARTADO                 :', JSON.stringify(fuera));
  const q = await page.$('.q');
  if (q) await q.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v3-${etiqueta}.png`});
  await browser.close();
  return fuera;
}

await corrida('a', 2, 'incorrecta');
await corrida('a', 0, 'correcta');
