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
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const snap = async (tag) => {
  const s = await page.evaluate(() => {
    const m = window.__tutoria.media;
    const play = document.querySelector('#play');
    const reloj = document.querySelector('.reloj, .tiempo, .time, .timecode');
    return {
      botonTexto: play ? play.textContent.trim() : '(sin #play)',
      botonAria: play ? play.getAttribute('aria-label') : null,
      paused: m.paused(), t: +m.currentTime().toFixed(3), dur: +m.duration().toFixed(2),
      relojTexto: reloj ? reloj.textContent.trim() : null,
      barra: (document.querySelector('.controles, .transport, .barra')||{}).innerText || null,
    };
  });
  console.log(tag, JSON.stringify(s));
  return s;
};

console.log('== estado inicial ==');
await snap('  inicial:');

// localizar el boton
const info = await page.evaluate(() => {
  const p = document.querySelector('#play');
  if (!p) return null;
  const r = p.getBoundingClientRect();
  return {texto:p.textContent.trim(), x:r.x+r.width/2, y:r.y+r.height/2, w:r.width, h:r.height};
});
console.log('  boton #play:', JSON.stringify(info));

console.log('== DOBLE CLIC (dos clics rapidos, delay ~80ms) ==');
await page.click('#play');
await page.waitForTimeout(80);
await page.click('#play');
await page.waitForTimeout(2000);
const s1 = await snap('  tras 2s:');

// seguir observando otros 3s por si arranca tarde
await page.waitForTimeout(3000);
await snap('  tras 5s:');

// recuperacion: pulsar otra vez
console.log('== pulsar otra vez ==');
await page.click('#play');
await page.waitForTimeout(1500);
await snap('  tras repulsar:');

await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-doble-empezar.png'});
await browser.close();
