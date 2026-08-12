import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SC='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
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
const ready = async () => { await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000}); };
const reloj = async () => page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0 && /^\d+:\d\d/.test((e.textContent||'').trim()));
  return el ? el.textContent.trim() : null; });
const st = async () => ({ ct:+(await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2),
  paused: await page.evaluate('window.__tutoria.media.paused()'),
  reloj: await reloj(),
  play: await page.evaluate(()=>{const b=document.querySelector('#play'); return b? b.textContent.trim():null;}),
  url: page.url() });

console.log('=== PASO A: reproducir hasta ~0:42 y recargar ===');
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'}); await ready();
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.currentTime() > 42', null, {timeout:90000});
console.log('antes del F5:', JSON.stringify(await st()));
await page.screenshot({path:SC+'A1-antes-f5.png'});
await page.reload({waitUntil:'domcontentloaded'}); await ready();
await page.waitForTimeout(800);
console.log('DESPUES del F5:', JSON.stringify(await st()));
await page.screenshot({path:SC+'A2-tras-f5.png'});
console.log('estado grafico tras F5:', JSON.stringify(await page.evaluate('JSON.stringify(window.__tutoria.estado())')).slice(0,300));

console.log('\n=== PASO B: llegar a ~1:41 y pulsar "English" ===');
await page.goto('http://localhost:57330/?lang=es&t=95', {waitUntil:'domcontentloaded'}); await ready();
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.currentTime() > 101', null, {timeout:90000});
console.log('antes de English:', JSON.stringify(await st()));
const href = await page.evaluate(()=>{const a=Array.from(document.querySelectorAll('a')).find(a=>/English|Espa/i.test(a.textContent)); return a?a.getAttribute('href'):null;});
console.log('href del enlace idioma:', href);
await page.screenshot({path:SC+'B1-antes-english.png'});
await page.click('a[href*="lang=en"]');
await page.waitForLoadState('domcontentloaded'); await ready(); await page.waitForTimeout(800);
console.log('DESPUES de English:', JSON.stringify(await st()));
await page.screenshot({path:SC+'B2-tras-english.png'});
await browser.close();
