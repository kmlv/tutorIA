import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});

async function abrir(url){
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.waitForTimeout(1000);
  return page;
}
const dump = (page) => page.evaluate(() => {
  const t = window.__tutoria;
  const e = t.estado();
  const svg = document.querySelector('.lienzo');
  return {
    ct: +t.media.currentTime().toFixed(2),
    estado: JSON.parse(JSON.stringify(e)),
    svgLen: svg ? svg.innerHTML.length : null,
    svgHash: svg ? svg.innerHTML.replace(/\s+/g,' ').slice(0,0) : null,
    paths: svg ? [...svg.querySelectorAll('path,polygon,line,circle,text')].length : null,
    textos: svg ? [...svg.querySelectorAll('text')].map(x=>x.textContent.trim()).filter(Boolean).slice(0,20) : null,
  };
});

console.log('### A) carga limpia t=0');
const p0 = await abrir('http://localhost:57330/?lang=es');
console.log(JSON.stringify(await dump(p0)));

console.log('### B) carga limpia t=84 (antes de pulsar)');
const p84 = await abrir('http://localhost:57330/?lang=es&t=84');
const b0 = await dump(p84); console.log(JSON.stringify(b0));
await p84.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v84b-antes.png'});

await (await p84.$('#play')).click();
for (const ms of [1500, 3000, 6000]) {
  await p84.waitForTimeout(ms===1500?1500:3000);
  const d2 = await dump(p84);
  console.log('  tras audio ct=', d2.ct, JSON.stringify({estado:d2.estado, paths:d2.paths, textos:d2.textos}));
}
await p84.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v84b-tras8s.png'});

console.log('### C) ¿existe API de seek pública? probamos media.seek(84) manual');
await p84.evaluate(()=>window.__tutoria.media.seek(84));
await p84.waitForTimeout(1500);
console.log(JSON.stringify(await dump(p84)));
await browser.close();
