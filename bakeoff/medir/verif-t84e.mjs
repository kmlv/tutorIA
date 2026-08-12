import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&t=84', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(800);
const s = () => page.evaluate(()=>({ct:+window.__tutoria.media.currentTime().toFixed(1),
  mostrar:window.__tutoria.estado().mostrar,
  cap:(document.querySelector('.caption-linea,.captions-band')||{textContent:''}).textContent.trim().slice(0,70),
  reloj:(document.getElementById('reloj')||{textContent:''}).textContent}));
console.log('carga t=84 :', JSON.stringify(await s()));
// La maquinaria de seek SÍ existe: al invocarla el gráfico se reconstruye.
await page.evaluate(()=>window.__tutoria.media.seek(20));
await page.waitForTimeout(1000);
console.log('tras seek(20):', JSON.stringify(await s()));
await page.evaluate(()=>window.__tutoria.media.seek(84));
await page.waitForTimeout(1000);
console.log('tras seek(84):', JSON.stringify(await s()));
// ¿la predicción de 87 se puede alcanzar sin esperar? play desde 84
await (await page.$('#play')).click();
await page.waitForTimeout(5000);
console.log('play 5s desde 84:', JSON.stringify(await s()), 'dock=', await page.evaluate(()=>window.__tutoria.dock.actual));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v84e-pred.png'});
await browser.close();
