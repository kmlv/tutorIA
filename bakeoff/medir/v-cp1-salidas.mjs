import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const errs=[]; page.on('pageerror', e => errs.push(String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:20000});
await page.waitForTimeout(600);

const burbujas = () => page.evaluate(() =>
  [...document.querySelectorAll('.dock .burbuja, .dock [class*=burbuja], .dock [class*=msg], .dock [class*=mensaje]')]
    .map(b=>({cls:b.className.slice(0,40), t:b.innerText.trim().slice(0,160)})));
const estado = () => page.evaluate(() => ({
  t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
  dockActual: window.__tutoria.dock.actual,
  dockText: document.querySelector('.dock')?.innerText.trim(),
}));

const opciones = await page.$$('.q-opciones button');
await opciones[1].click();
await page.waitForTimeout(1500);
console.log('--- tras respuesta incorrecta ---');
console.log(JSON.stringify(await estado(),null,1));
console.log('BURBUJAS:', JSON.stringify(await burbujas(),null,1));

// A) esperar 45 s
await page.waitForTimeout(45000);
const e45 = await estado();
console.log('\n--- tras 45 s ---'); console.log(JSON.stringify(e45,null,1));

// B) pulsar cada chip
for (const chip of ['No entiendo','Otro ejemplo','Más despacio','¿Por qué?']) {
  const antesLen = (await estado()).dockText.length;
  const b = await page.$(`.dock button:has-text("${chip}")`);
  if (!b) { console.log('chip no encontrado:', chip); continue; }
  await b.click(); await page.waitForTimeout(2500);
  const st = await estado();
  console.log(`\nCHIP "${chip}": dockLen ${antesLen} -> ${st.dockText.length}  (delta ${st.dockText.length-antesLen})`);
  if (st.dockText.length!==antesLen) console.log('   NUEVO TEXTO:', st.dockText.slice(antesLen-50));
}

// C) composer: contestar la repregunta
await page.fill('.composer-input','No, el precio relativo no cambia');
await page.click('.composer-enviar');
await page.waitForTimeout(6000);
const eC = await estado();
console.log('\n--- tras enviar respuesta por el composer ---');
console.log(eC.dockText);
console.log('t=',eC.t,'paused=',eC.paused);

// D) siguen deshabilitadas las opciones?
console.log('\nopciones disabled:', await page.evaluate(()=>[...document.querySelectorAll('.q-opciones button')].map(b=>b.disabled)));

// E) Listo sigamos
const b = await page.$('.dock button:has-text("Listo, sigamos")');
await b.click(); await page.waitForTimeout(3000);
const eE = await estado();
console.log('\n--- tras "Listo, sigamos" ---');
console.log(eE.dockText);
console.log('t=',eE.t,'paused=',eE.paused);
await page.screenshot({path:OUT+'/v4-listo.png'});
console.log('\nERRS:',errs);
await browser.close();
