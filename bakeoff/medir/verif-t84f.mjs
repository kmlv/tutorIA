import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es&t=84', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(800);
// referencia: cómo debería verse el gráfico a los 26 s (carga limpia ?t=26)
const p2 = await ctx.newPage();
await p2.goto('http://localhost:57330/?lang=es&t=26', {waitUntil:'domcontentloaded'});
await p2.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await p2.waitForTimeout(600);
console.log('referencia t=26 :', JSON.stringify(await p2.evaluate(()=>window.__tutoria.estado().mostrar)));
await (await page.$('#play')).click();
await page.waitForTimeout(28000);
const r = await page.evaluate(()=>({ct:+window.__tutoria.media.currentTime().toFixed(1),
  mostrar:window.__tutoria.estado().mostrar,
  reloj:document.getElementById('reloj').textContent,
  cap:document.querySelector('.captions-band').textContent.trim().slice(0,90)}));
console.log('t=84 + play 28s:', JSON.stringify(r));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v84f-26s.png'});
await p2.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v84f-ref26.png'});
await browser.close();
