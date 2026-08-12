import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage(); let nets=[];
page.on('pageerror', e=>console.log('  JS ERROR:', String(e).slice(0,180)));
page.on('response', async r=>{ if(r.url().includes('/answer')){ try{nets.push(JSON.parse(await r.text()));}catch(e){} }});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#play'); await page.waitForTimeout(300);
await page.evaluate('window.__tutoria.media.seek(143)');
if (await page.evaluate('window.__tutoria.media.paused()')) await page.click('#play');
await page.waitForSelector('.q', {timeout:20000}); await page.waitForTimeout(800);
console.log('CHECKPOINT cp1 en t=', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2));
console.log('enunciado:', await page.$eval('.q-enunciado', e=>e.textContent.trim()).catch(()=>'(n/a)'));
const ops = await page.$$eval('.q-opciones button', bs=>bs.map(b=>b.textContent.trim()));
console.log('opciones:', ops.length ? ops : '(sin .q-opciones -> puede ser respuesta libre)');
if (!ops.length) console.log('HTML de .q:', (await page.$eval('.q', e=>e.innerHTML)).slice(0,700));
if (ops.length) {
  // elegir la ultima (probable distractor)
  await page.click(`.q-opciones button:nth-of-type(${ops.length})`);
} else {
  await page.fill('.composer-input', 'no se');
  await page.click('.composer-enviar');
}
await page.waitForTimeout(5000);
const o = await page.evaluate(()=>({
  dockActual: window.__tutoria?.dock?.actual,
  dockText: document.querySelector('.dock')?.innerText.replace(/\s+/g,' ').trim().slice(0,900),
  paused: window.__tutoria.media.paused(), t: window.__tutoria.media.currentTime(),
}));
console.log('\nrespuestas del servidor:', JSON.stringify(nets,null,1).slice(0,900));
console.log('\ndock.actual =', o.dockActual, ' paused =', o.paused, ' t =', o.t.toFixed(2));
console.log('dock en pantalla:', o.dockText);
const soc = nets.map(n=>n.socratica).filter(Boolean)[0];
if (soc) console.log('\n>> ¿socratica del checkpoint VISIBLE en el dock?', o.dockText.includes(soc.trim().replace(/\s+/g,' ').slice(0,30)));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-cp.png'});
await browser.close();
