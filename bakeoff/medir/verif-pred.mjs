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
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,200)); });
page.on('response', async r => {
  if (r.url().includes('/answer')) {
    let b=''; try{ b = await r.text(); }catch(e){ b='<no body>'; }
    console.log('  NET', r.status(), r.url().replace('http://localhost:57330',''), '->', b.slice(0,500));
  }
});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('cargado. duracion =', await page.evaluate('window.__tutoria.media.duration()'));

// pulsar Empezar
const playTxt = await page.$eval('#play', e=>e.textContent.trim()).catch(()=>null);
console.log('boton #play texto:', JSON.stringify(playTxt));
await page.click('#play');
await page.waitForTimeout(500);
await page.evaluate('window.__tutoria.media.seek(85)');
await page.waitForTimeout(300);
console.log('t tras seek =', await page.evaluate('window.__tutoria.media.currentTime()'), 'paused =', await page.evaluate('window.__tutoria.media.paused()'));
if (await page.evaluate('window.__tutoria.media.paused()')) { await page.click('#play'); }

// esperar la pregunta
await page.waitForSelector('.q', {timeout:20000});
await page.waitForTimeout(800);
const t = await page.evaluate('window.__tutoria.media.currentTime()');
console.log('PREGUNTA visible en t =', t, ' paused =', await page.evaluate('window.__tutoria.media.paused()'));
const enun = await page.$eval('.q-enunciado', e=>e.textContent.trim()).catch(()=>'(sin .q-enunciado)');
console.log('enunciado:', enun);
const ops = await page.$$eval('.q-opciones button', bs=>bs.map((b,i)=>i+': '+b.textContent.trim()));
console.log('opciones:', ops);

const snap = async (label) => {
  const o = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    return {
      dockHTMLlen: dock ? dock.innerHTML.length : -1,
      dockText: dock ? dock.innerText.replace(/\s+/g,' ').trim().slice(0,900) : '(no dock)',
      dockClass: dock ? dock.className : '(no dock)',
      dockVisible: dock ? !!(dock.offsetWidth||dock.offsetHeight||dock.getClientRects().length) : false,
      dockActual: (window.__tutoria && window.__tutoria.dock) ? JSON.stringify(window.__tutoria.dock.actual).slice(0,600) : '(n/a)',
      qPresent: !!document.querySelector('.q'),
      qText: document.querySelector('.q') ? document.querySelector('.q').innerText.replace(/\s+/g,' ').trim().slice(0,600) : '(no .q)',
      bodyText: document.body.innerText.replace(/\s+/g,' ').trim().slice(0,1500),
    };
  });
  console.log('\n=== SNAPSHOT', label, '===');
  for (const k of Object.keys(o)) console.log('  ', k, ':', o[k]);
  return o;
};
const antes = await snap('ANTES DE RESPONDER');

console.log('\n>>> pulsando opcion 3 (indice 2): ', ops[2]);
await page.click('.q-opciones button:nth-of-type(3)');
for (const ms of [400, 1200, 3000]) {
  await page.waitForTimeout(ms===400?400:(ms===1200?800:1800));
  console.log('\n--- tras ~'+ms+'ms | t='+ (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2) + ' paused=' + await page.evaluate('window.__tutoria.media.paused()'));
  await snap('t+'+ms);
}
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-pred-fallo.png'});
await browser.close();
