import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const errs=[]; page.on('pageerror', e=>errs.push(String(e).slice(0,160)));
page.on('console', m=>{ if(m.type()==='error') errs.push('console: '+m.text().slice(0,160)); });
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0', null, {timeout:30000});
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/dbl-antes.png'});
await page.dblclick('#play');
await page.waitForTimeout(2000);
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/dbl-despues.png'});
// visibilidad de las partes clave
const vis = await page.evaluate(() => {
  const g = s => { const e=document.querySelector(s); if(!e) return 'NO EXISTE';
    const r=e.getBoundingClientRect(); const cs=getComputedStyle(e);
    return `${Math.round(r.width)}x${Math.round(r.height)} vis=${cs.visibility} op=${cs.opacity}`; };
  return {escenario:g('.escenario'), lienzo:g('.lienzo'), bands:g('.bands'),
          captions:g('.captions-band'), dock:g('.dock'), q:g('.q'),
          botonHab: !document.querySelector('#play').disabled,
          askHab: !(document.querySelector('#ask')||{}).disabled};
});
console.log('visibilidad:', JSON.stringify(vis,null,1));
console.log('errores JS/consola:', errs.length? errs : '(ninguno)');
// ¿el resto de acciones siguen disponibles?
await page.click('#ask'); await page.waitForTimeout(800);
console.log('tras pulsar #ask -> dock =', await page.evaluate(()=>window.__tutoria.dock.actual),
            '| boton =', (await page.textContent('#play')).trim());
await browser.close();
