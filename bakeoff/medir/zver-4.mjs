import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const OUT='/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe-v';
// CONTROL: carga limpia, reproducir desde 0
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#play');
const rep = async(tag)=>{ const i = await page.evaluate(()=>({t:+__tutoria.media.currentTime().toFixed(1), mostrar:__tutoria.estado().mostrar, lienzoLen:(document.querySelector('.lienzo')?.innerHTML||'').length, capaManip:!!document.querySelector('.capa-manip')})); console.log('CONTROL '+tag, JSON.stringify(i)); return i; };
for (const target of [2,6,12,19]) {
  await page.waitForFunction(`__tutoria.media.currentTime() >= ${target}`, null, {timeout:60000});
  await rep('t'+target);
}
await page.screenshot({path:path.join(OUT,'ctrl-t19.png')});
await browser.close();
