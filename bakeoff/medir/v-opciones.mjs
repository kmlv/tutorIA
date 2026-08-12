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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// paso 2
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForSelector('.q', {timeout:20000});
await page.waitForTimeout(1200);

const dump = async (etiqueta) => {
  const r = await page.evaluate(() => {
    const q = document.querySelector('.q');
    if (!q) return {sinQ:true};
    const bs = [...q.querySelectorAll('.q-opciones button')];
    return {
      qid: q.getAttribute('data-cp') || q.id || q.className,
      enunciado: (q.querySelector('.q-enunciado')||{}).textContent,
      pausado: window.__tutoria.media.paused(),
      t: window.__tutoria.media.currentTime(),
      botones: bs.map(b => {
        const cs = getComputedStyle(b);
        const be = getComputedStyle(b, '::before');
        const af = getComputedStyle(b, '::after');
        return {
          txt: b.textContent.trim().slice(0,60),
          cls: b.className,
          aria: {sel: b.getAttribute('aria-selected'), dis: b.disabled, press: b.getAttribute('aria-pressed'), lab: b.getAttribute('aria-label')},
          bg: cs.backgroundColor, border: cs.border, color: cs.color,
          shadow: cs.boxShadow, opacity: cs.opacity, weight: cs.fontWeight,
          outline: cs.outline, textDeco: cs.textDecorationLine,
          beforeContent: be.content, beforeBg: be.backgroundColor,
          afterContent: af.content, afterBg: af.backgroundColor,
        };
      })
    };
  });
  console.log('--- ' + etiqueta + ' ---');
  console.log(JSON.stringify(r, null, 1));
  return r;
};

const antes = await dump('ANTES de contestar');

// paso 3: pulsar tercera opcion
const opts = await page.$$('.q-opciones button');
console.log('num opciones:', opts.length);
const textos = [];
for (const o of opts) textos.push((await o.textContent()).trim());
console.log('textos:', JSON.stringify(textos));
await opts[2].click();
await page.waitForTimeout(1500);

const desp = await dump('DESPUES de pulsar la 3a');

// comparacion de "identicas"
const cmp = await page.evaluate(() => {
  const bs = [...document.querySelectorAll('.q .q-opciones button')];
  if (!bs.length) return 'no hay botones';
  const clave = b => {
    const cs = getComputedStyle(b); const be = getComputedStyle(b,'::before'); const af = getComputedStyle(b,'::after');
    return [cs.backgroundColor,cs.border,cs.color,cs.boxShadow,cs.opacity,cs.fontWeight,cs.outline,
            be.content,be.backgroundColor,be.borderColor,af.content,af.backgroundColor].join('|');
  };
  const ks = bs.map(clave);
  return {identicas: ks.every(k=>k===ks[0]), claves: ks};
});
console.log('COMPARACION:', JSON.stringify(cmp, null, 1));

await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v-op-despues.png'});
const box = await page.$('.q');
if (box) await box.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v-op-q.png'});
await browser.close();
