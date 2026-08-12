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
const errs = [];
page.on('pageerror', e => { errs.push(String(e).slice(0,300)); console.log('  JS ERROR:', String(e).slice(0,300)); });
page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,300)); });

// PASO 1: cargar es/B limpio
console.log('== PASO 1: http://localhost:57330/?lang=es&variant=B ==');
await page.goto('http://localhost:57330/?lang=es&variant=B', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('  duracion:', await page.evaluate('window.__tutoria.media.duration()'));
console.log('  ownsStage:', await page.evaluate('window.__tutoria.media.ownsStage'));
console.log('  video src:', await page.evaluate('document.querySelector("video")?.currentSrc || "(sin video)"'));

// PASO 2: pulsar Empezar y dejar correr a ~62s
const btnPlay = await page.$('#play');
console.log('  texto #play:', await btnPlay.textContent());
await btnPlay.click();
await page.waitForTimeout(1500);
await page.evaluate('window.__tutoria.media.seek(62)');
await page.waitForTimeout(2000);
console.log('  t ahora:', await page.evaluate('window.__tutoria.media.currentTime()'));
console.log('  paused:', await page.evaluate('window.__tutoria.media.paused()'));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v1-esB-62s.png'});

// PASO 3: encontrar el enlace de idioma
const links = await page.$$eval('a', as => as.map(a=>({txt:a.textContent.trim(), href:a.getAttribute('href')})));
console.log('  enlaces:', JSON.stringify(links));
