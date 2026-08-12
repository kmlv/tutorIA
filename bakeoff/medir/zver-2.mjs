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
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const OUT='/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe-v';
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForTimeout(3000);

const snap = async (tag) => {
  const info = await page.evaluate(() => {
    const cm = document.querySelector('.capa-manip');
    const rects = cm ? [...cm.querySelectorAll('*')].map(e=>{
      const r = e.getBoundingClientRect();
      return {tag:e.tagName, cls:e.getAttribute('class'), r:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
    }) : null;
    const svg = document.querySelector('.lienzo svg') || document.querySelector('.lienzo');
    return {
      t: +window.__tutoria.media.currentTime().toFixed(2),
      paused: window.__tutoria.media.paused(),
      q: document.querySelector('.q-enunciado')?.textContent?.trim().slice(0,160) || null,
      manip: !!document.querySelector('.q-manip'),
      capaManip: !!cm,
      capaManipVisible: cm ? getComputedStyle(cm).display + '/' + getComputedStyle(cm).visibility + '/op' + getComputedStyle(cm).opacity : null,
      capaManipKids: rects,
      lienzoKids: [...(document.querySelector('.lienzo')?.children||[])].map(c=>c.getAttribute('class')||c.tagName),
      lienzoInner: (document.querySelector('.lienzo')?.innerHTML||'').length,
      play: document.querySelector('#play')?.textContent?.trim(),
    };
  });
  console.log('=== '+tag+' '+JSON.stringify(info));
  await page.screenshot({path: path.join(OUT, tag+'.png')});
  return info;
};

// paso 3: contestar bien
await page.click('.q-opciones button:nth-child(1)');
await page.waitForTimeout(1500);
await snap('02-tras-respuesta');
// esperar a que aparezca la manip
try { await page.waitForSelector('.q-manip', {timeout:8000}); } catch(e){ console.log('no aparecio .q-manip'); }
await page.waitForTimeout(1000);
await snap('03-manip-visible');

// paso 4: pulsar Seguir
await page.click('#play');
await page.waitForTimeout(400);
await snap('04-justo-tras-seguir');
// paso 5: a los 0:02
for (let i=0;i<6;i++){
  await page.waitForTimeout(500);
  const t = await page.evaluate('__tutoria.media.currentTime()');
  if (t>=1.9) break;
}
await snap('05-en-t2');
await page.waitForTimeout(2000);
await snap('06-en-t4');
await browser.close();
