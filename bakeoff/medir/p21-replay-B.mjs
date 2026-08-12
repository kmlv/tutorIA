import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
await page.goto('http://localhost:57330/?lang=es&variant=B&t=229',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate('window.__tutoria.media.play()'); await page.waitForTimeout(9000);
console.log('practica lista');
await page.click('#play');           // "Seguir" -> reinicia
await page.waitForTimeout(1500);
await page.evaluate('window.__tutoria.media.seek(45)');
await page.waitForTimeout(2500);
console.log(JSON.stringify(await page.evaluate(`(()=>{const v=document.querySelector('video');return{
 t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(),
 video:getComputedStyle(v).display, lienzo:getComputedStyle(document.querySelector('.lienzo')).display,
 estado:(({mostrar})=>mostrar)(window.__tutoria.estado()),
 caption:(document.querySelector('.captions-band')||{}).innerText.split('\\n')[0],
 dock:window.__tutoria.dock.actual}})()`)));
await page.screenshot({path:SP+'/B-replay-t45.png'});
await browser.close();
