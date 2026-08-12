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
const jsErrs=[]; page.on('pageerror', e => jsErrs.push(String(e).slice(0,200)));
const reqs=[]; page.on('request', r => { if (r.url().includes('/api/')) reqs.push(r.method()+' '+r.url()); });

// ENTRADA DIRECTA a en/B (carga limpia, sin pasar por es)
console.log('=== A) ENTRADA DIRECTA http://localhost:57330/?lang=en&variant=B ===');
await page.goto('http://localhost:57330/?lang=en&variant=B', {waitUntil:'domcontentloaded'});
await page.waitForTimeout(4000);
console.log('  JS errors:', JSON.stringify(jsErrs));
console.log('  __tutoria:', await page.evaluate('typeof window.__tutoria'));
console.log('  __tutoriaSesion:', await page.evaluate('typeof window.__tutoriaSesion'));
console.log('  #play texto/disabled:', await page.$eval('#play', e=>e.textContent+' / disabled='+e.disabled));
console.log('  reloj:', await page.evaluate(`[...document.querySelectorAll('*')].map(e=>e.childElementCount===0?e.textContent.trim():'').filter(t=>/^\\d+:\\d\\d$/.test(t))[0]`));
console.log('  video currentSrc:', JSON.stringify(await page.evaluate('document.querySelector("video")?.currentSrc')));
console.log('  video readyState:', await page.evaluate('document.querySelector("video")?.readyState'));
console.log('  .lienzo display:', await page.evaluate('document.querySelector(".lienzo") ? getComputedStyle(document.querySelector(".lienzo")).display : "n/a"'));
console.log('  .lienzo svg paths:', await page.evaluate('document.querySelectorAll(".lienzo svg *").length'));
console.log('  cues visibles/bands:', await page.evaluate('document.querySelectorAll(".bands *").length'));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v-enB-directo.png', fullPage:false});

// pulsar Start x2 y esperar
for (let i=0;i<2;i++){ await page.evaluate('document.querySelector("#play").click()'); await page.waitForTimeout(1500); }
console.log('  tras 2x Start -> #play:', await page.$eval('#play', e=>e.textContent), '| video.paused:', await page.evaluate('document.querySelector("video")?.paused'), '| video.currentTime:', await page.evaluate('document.querySelector("video")?.currentTime'));

// Ask
await page.evaluate('document.querySelector("#ask").click()');
await page.waitForTimeout(1200);
console.log('  tras Ask -> .dock class:', await page.$eval('.dock', e=>e.className), '| dock innerText:', JSON.stringify(await page.$eval('.dock', e=>e.innerText.replace(/\n+/g,' | ').slice(0,200))));

// escribir + enviar por JS (evitando intercepcion de la caption-bar)
const antes = reqs.length;
await page.evaluate(() => {
  const i = document.querySelector('.composer-input');
  i.focus(); i.value = 'why does the line slope down?';
  i.dispatchEvent(new Event('input', {bubbles:true}));
});
console.log('  valor escrito:', JSON.stringify(await page.$eval('.composer-input', e=>e.value)));
await page.evaluate('document.querySelector(".composer-enviar").click()');
await page.waitForTimeout(6000);
console.log('  peticiones /api tras enviar:', JSON.stringify(reqs.slice(antes)));
console.log('  .dock tras enviar:', JSON.stringify(await page.$eval('.dock', e=>e.innerText.replace(/\n+/g,' | ').slice(0,300))));
console.log('  input sigue con texto?:', JSON.stringify(await page.$eval('.composer-input', e=>e.value)));
// probar Enter tambien
await page.click('.composer-input',{force:true}).catch(()=>{});
await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
console.log('  tras Enter -> dock:', JSON.stringify(await page.$eval('.dock', e=>e.innerText.replace(/\n+/g,' | ').slice(0,200))));
console.log('  JS errors totales:', JSON.stringify(jsErrs));
console.log('  todas las /api:', JSON.stringify(reqs));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v-enB-tras-preguntar.png'});

// salidas visibles
console.log('  enlaces/botones visibles:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('button,a')].filter(e=>e.offsetParent!==null).map(e=>e.textContent.trim().slice(0,24)+(e.getAttribute('href')?' -> '+e.getAttribute('href'):'')))));

// CONTROL 1: en/A por defecto
console.log('\n=== B) CONTROL http://localhost:57330/?lang=en (variante A por defecto) ===');
jsErrs.length=0;
await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
await page.waitForTimeout(4000);
console.log('  __tutoria:', await page.evaluate('typeof window.__tutoria'), '| duration:', await page.evaluate('window.__tutoria ? window.__tutoria.media.duration() : null'));
console.log('  JS errors:', JSON.stringify(jsErrs));
console.log('  enlace idioma:', JSON.stringify(await page.$$eval('a', as=>as.map(a=>a.textContent.trim()+' -> '+a.getAttribute('href')))));

// CONTROL 2: en/A -> clic Español -> href arrastra variant?
console.log('\n=== C) CONTROL es/B -> English -> Español (¿se puede volver?) ===');
await page.goto('http://localhost:57330/?lang=en&variant=B', {waitUntil:'domcontentloaded'});
await page.waitForTimeout(3000);
console.log('  href del enlace en la pagina muerta:', JSON.stringify(await page.$$eval('a', as=>as.map(a=>a.textContent.trim()+' -> '+a.getAttribute('href')))));
await page.click('a:has-text("Español")');
await page.waitForTimeout(4000);
console.log('  URL tras Español:', page.url(), '| __tutoria:', await page.evaluate('typeof window.__tutoria'));
await browser.close();
