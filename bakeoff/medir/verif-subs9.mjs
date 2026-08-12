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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#play');
await page.evaluate(()=>window.__tutoria.media.seek(85));
await page.evaluate(()=>window.__tutoria.media.play());
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
await page.waitForTimeout(500);

// 1) persistencia: sigue ahi 8s despues?
await page.waitForTimeout(8000);
console.log('1) tras 8 s pausado, caption =', JSON.stringify(await page.$eval('.caption-current', n=>n.textContent.trim())));
console.log('   media.paused =', await page.evaluate(()=>window.__tutoria.media.paused()));

// 2) estilo cuando se oculta
await page.click('.caption-toggle');
await page.waitForTimeout(300);
const est = await page.$eval('.caption-current', n => {
  const cs = getComputedStyle(n);
  return {display:cs.display, visibility:cs.visibility, opacity:cs.opacity, ariaHidden:n.getAttribute('aria-hidden'),
          textContentLen:(n.textContent||'').length, ariaLive:n.getAttribute('aria-live'), rect:n.getBoundingClientRect().toJSON()};
});
console.log('2) .caption-current oculto ->', JSON.stringify(est));
await page.click('.caption-toggle'); // volver a mostrar

// 3) transcripcion: se puede abrir con la pregunta en pantalla y muestra el futuro?
await page.click('details.transcript > summary');
await page.waitForTimeout(400);
const tr = await page.evaluate(()=>{
  const det = document.querySelector('details.transcript');
  const rows = [...det.querySelectorAll('.transcript-row')].map(r=>r.textContent.trim());
  return {open: det.open, n: rows.length, futuroSlope: rows.find(r=>r.includes('pendiente es menos')), futuroPrecio: rows.find(r=>r.includes('gira'))};
});
console.log('3) transcripcion:', JSON.stringify(tr,null,1));
await page.screenshot({path: SP+'C-transcripcion-abierta.png'});

// 4) tras responder MAL, sigue el subtitulo delator?
await page.click('details.transcript > summary');
await page.waitForTimeout(200);
const antes = await page.$eval('.caption-current', n=>n.textContent.trim());
const botones = await page.$$('.q .q-opciones button');
await botones[2].click();  // opcion incorrecta
await page.waitForTimeout(1200);
console.log('4) tras responder MAL: caption =', JSON.stringify(await page.$eval('.caption-current', n=>n.textContent.trim())));
console.log('   (era la misma antes?', antes === await page.$eval('.caption-current', n=>n.textContent.trim()), ')');
await page.screenshot({path: SP+'D-tras-fallar.png'});
await browser.close();
