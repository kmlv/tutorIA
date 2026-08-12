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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForTimeout(3000);
await page.click('.q-opciones button:nth-child(1)');
await page.waitForSelector('.q-manip', {timeout:8000});
await page.waitForTimeout(1200);
await page.click('#play');           // Seguir
await page.waitForTimeout(2500);
const s = async(tag)=>{const i= await page.evaluate(()=>({t:+__tutoria.media.currentTime().toFixed(1), paused:__tutoria.media.paused(), dock:__tutoria.dock?.actual, dockW:Math.round(document.querySelector('.dock').getBoundingClientRect().width), capaManip:!!document.querySelector('.capa-manip'), qManip:!!document.querySelector('.q-manip'), play:document.querySelector('#play')?.textContent.trim()})); console.log(tag, JSON.stringify(i)); return i;};
await s('tras-seguir');
await page.click('#play'); await page.waitForTimeout(1000); await s('pausa1');
await page.click('#play'); await page.waitForTimeout(1000); await s('play2');
await page.click('#play'); await page.waitForTimeout(1000);
// pulsar Preguntar
await page.click('#ask'); await page.waitForTimeout(1200); await s('tras-preguntar');
await page.screenshot({path:path.join(OUT,'y-tras-preguntar.png')});
// cerrar? escribir y enviar
const inp = await page.$('.composer-input');
if (inp){ await inp.fill('hola'); await page.click('.composer-enviar'); await page.waitForTimeout(2500); await s('tras-enviar'); await page.screenshot({path:path.join(OUT,'y-tras-enviar.png')}); }
// seguir de nuevo
await page.click('#play'); await page.waitForTimeout(2000); await s('seguir2'); await page.screenshot({path:path.join(OUT,'y-seguir2.png')});
// saltar de nuevo al final: vuelve la manip?
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2)'); await page.waitForTimeout(3000); await s('refinal'); await page.screenshot({path:path.join(OUT,'y-refinal.png')});
await browser.close();
