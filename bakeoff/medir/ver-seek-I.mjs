import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SC='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
const ready = async()=>page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const st = async()=>page.evaluate(()=>{
  const el=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0&&/^\d+:\d\d/.test((e.textContent||'').trim()));
  return {ct:+window.__tutoria.media.currentTime().toFixed(2), reloj:el&&el.textContent.trim(),
    play:document.querySelector('#play')?.textContent.trim(), url:location.href};});

await page.goto('http://localhost:57330/?lang=es&t=0',{waitUntil:'domcontentloaded'}); await ready();
await page.click('#play');
await page.waitForSelector('.q-opciones button',{timeout:150000});
console.log('pregunta en', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(1));
const ops = await page.evaluate(()=>Array.from(document.querySelectorAll('.q-opciones button')).map(b=>b.textContent.trim().slice(0,60)));
console.log('opciones:', JSON.stringify(ops));
await page.click('.q-opciones button:nth-child(1)');
await page.waitForTimeout(2500);
console.log('tras responder:', JSON.stringify(await st()), 'q?', await page.evaluate(()=>!!document.querySelector('.q')));
// reanudar si hace falta
if (await page.evaluate('window.__tutoria.media.paused()')) { await page.click('#play'); }
await page.waitForFunction('window.__tutoria.media.currentTime() > 101',null,{timeout:120000});
await page.click('#play'); await page.waitForTimeout(300); // pausar en ~1:41 para leer la barra
console.log('EN 1:41 ->', JSON.stringify(await st()));
await page.screenshot({path:SC+'B1-141.png'});
const barra = await page.evaluate(()=>{
  const a=Array.from(document.querySelectorAll('a')).find(a=>/English/i.test(a.textContent));
  let n=a; for(let i=0;i<4&&n;i++) n=n.parentElement;
  return {href:a&&a.getAttribute('href'), barra:(a&&a.parentElement||{}).innerText, contenedor:(n||{}).innerText};});
console.log('barra:', JSON.stringify(barra));
await page.click('a[href*="lang=en"]'); await page.waitForLoadState('domcontentloaded'); await ready(); await page.waitForTimeout(1200);
console.log('TRAS English ->', JSON.stringify(await st()));
console.log('grafico tras English:', await page.evaluate(()=>JSON.stringify(window.__tutoria.estado().mostrar)));
await page.screenshot({path:SC+'B2-tras-english.png'});
await browser.close();
