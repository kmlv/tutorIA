import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const lang = process.argv[2] || 'es';
await page.goto(`http://localhost:57330/?lang=${lang}`, {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// CARGA LIMPIA: pulsar Empezar
await page.click('#play');
await page.waitForTimeout(400);
console.log('detalles transcripcion abierto al inicio?', await page.$eval('details.transcript', n=>n.open));

async function probar(seekTo, etiqueta) {
  await page.evaluate(t => window.__tutoria.media.seek(t), seekTo);
  await page.evaluate(() => window.__tutoria.media.play());
  // esperar a que se pause solo
  await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const cur = document.querySelector('.caption-current');
    const q = document.querySelector('.q');
    return {
      t: window.__tutoria.media.currentTime(),
      caption: cur ? (cur.textContent||'').trim() : '(sin .caption-current)',
      captionVisible: cur ? cur.offsetParent!==null : false,
      enunciado: document.querySelector('.q-enunciado')?.textContent?.trim() || null,
      opciones: [...document.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim()),
      qRect: q ? q.getBoundingClientRect().toJSON() : null,
      capRect: cur ? cur.getBoundingClientRect().toJSON() : null,
      toggle: document.querySelector('.caption-toggle')?.textContent?.trim(),
    };
  });
  console.log('=== ' + etiqueta + ' ===');
  console.log(JSON.stringify(r,null,1));
  await page.screenshot({path: SP + `cap-${lang}-${etiqueta}.png`});
}

await probar(85, 'line_vs_set');
// responder para seguir? primero probamos slope directamente con seek
await probar(121, 'slope_sign');
await probar(173, 'price_effect');
await probar(142, 'cp1');
await browser.close();
