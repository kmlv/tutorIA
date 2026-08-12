import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
page.on('dialog', async dl=>{console.log('  DIALOG', dl.type(), dl.message()); await dl.dismiss();});
const S = async t => { const o = await page.evaluate(`(()=>{const qs=[...document.querySelectorAll('.q')];return{
  url:location.search, t:+window.__tutoria.media.currentTime().toFixed(1), reloj:(document.querySelector('.reloj')||document.querySelector('.t')||{}).textContent,
  sess:window.__tutoriaSesion.session_id, nQ:qs.length, resp:qs.filter(q=>q.querySelector('.elegida')).length,
  dock:window.__tutoria.dock.actual, ls:Object.keys(localStorage), ss:Object.keys(sessionStorage)}})()`); console.log(t, JSON.stringify(o)); return o; };
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate('window.__tutoria.media.seek(84); window.__tutoria.media.play()');
await page.waitForSelector('.q',{timeout:20000}); await page.waitForTimeout(600);
await page.click('.q-opciones button'); await page.waitForTimeout(1500);
await page.evaluate('window.__tutoria.media.paused() && window.__tutoria.media.play()');
await page.evaluate('window.__tutoria.media.seek(142); window.__tutoria.media.play()');
await page.waitForTimeout(6000);
const antes = await S('ANTES  ');
const qs = await page.$$('.q'); const bs = await qs[qs.length-1].$$('.q-opciones button');
if (bs.length) { await bs[0].click(); await page.waitForTimeout(2000); }
await S('CP1 OK ');
await page.click('.idioma');
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.waitForTimeout(2000);
await S('DESPUES');
console.log('  dock text:', (await page.evaluate(`document.querySelector('.dock').innerText`)).replace(/\n+/g,' | ').slice(0,250));
console.log('  h1:', await page.evaluate(`document.querySelector('h1').textContent`));
await browser.close();
