import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const snap=`(()=>{const q=document.querySelector('.q');const r=q?q.getBoundingClientRect():null;
 return {t:+window.__tutoria.media.currentTime().toFixed(1),paused:window.__tutoria.media.paused(),
 dock:window.__tutoria.dock.actual,qRect:r?[Math.round(r.width),Math.round(r.height)]:null,
 nOpc:document.querySelectorAll('.q-opciones button').length,
 dockTail:(document.querySelector('.dock')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(-160)}})()`;
const rd=async t=>console.log(t.padEnd(18),JSON.stringify(await page.evaluate(snap)));
await page.goto('http://localhost:57330/?lang=es&variant=B&t=228',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.click('#play');
await page.waitForFunction('document.querySelectorAll(".q").length>0',null,{timeout:40000});
await page.waitForTimeout(2000); await rd('practica');
await page.click('#play'); await page.waitForTimeout(2000); await rd('tras Seguir');
// ¿se puede responder con el dock oculto? intentamos clic forzado
const vis = await page.evaluate(`(()=>{const b=document.querySelector('.q-opciones button');const r=b.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),vis:!!(r.width&&r.height)}})()`);
console.log('  opcion 1 visible?', JSON.stringify(vis));
await page.click('#ask'); await page.waitForTimeout(1200); await rd('tras Preguntar');
// ahora responder
await page.click('.q-opciones button'); await page.waitForTimeout(2000); await rd('tras responder');
await page.screenshot({path:SP+'/B-4-respondida.png'});
await browser.close();
