import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:20000}); await page.waitForTimeout(600);
const o = await page.$$('.q-opciones button'); await o[1].click(); await page.waitForTimeout(2000);
const sb = await page.$('button.primario:has-text("Seguir")');
console.log('boton Seguir (barra del reproductor) presente:', !!sb, 'disabled=', sb? await sb.isDisabled():null);
await sb.click(); await page.waitForTimeout(1200);
console.log('tras pulsar Seguir: t=', await page.evaluate('window.__tutoria.media.currentTime()'),
  'paused=', await page.evaluate('window.__tutoria.media.paused()'));
await page.waitForTimeout(16000);
console.log('t=', await page.evaluate('window.__tutoria.media.currentTime()'),
  'caption=', await page.evaluate(()=>document.querySelector('.captions-band')?.innerText.split('\n')[0]));
await page.screenshot({path:OUT+'/v8-seguir.png'});
await browser.close();
