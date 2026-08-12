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
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&variant=b', {waitUntil:'domcontentloaded'});
await page.waitForTimeout(3500);

const inv = async (tag) => {
  const s = await page.evaluate(() => ({
    hook: typeof window.__tutoria !== 'undefined',
    url: location.href,
    reloj: (document.body.innerText.match(/\d+:\d\d/g)||[])[0],
    dock: document.querySelector('.dock') ? document.querySelector('.dock').innerText.slice(0,120).replace(/\n+/g,' | ') : 'NO-DOCK',
    composer: !!document.querySelector('.composer-input'),
    preguntas: document.querySelectorAll('.q').length,
    caption: document.querySelector('.captions-band') ? document.querySelector('.captions-band').innerText.slice(0,80) : 'NO-BAND',
  }));
  console.log(tag, JSON.stringify(s));
};
await inv('inicial ');

// 1. pulsar play varias veces
for (let i=0;i<3;i++){ await page.click('#play').catch(()=>{}); await page.waitForTimeout(700); }
await inv('3xplay ');

// 2. pulsar Preguntar
await page.click('#ask').catch(e=>console.log('ask click fail', String(e).slice(0,100)));
await page.waitForTimeout(1500);
await inv('tras ask');

// 3. escribir en el composer si existe
const ci = await page.$('.composer-input');
if (ci) { await ci.click(); await page.keyboard.type('que es la pendiente?');
  await page.click('.composer-enviar').catch(()=>{}); await page.waitForTimeout(4000); await inv('tras env'); }
else console.log('composer: no existe');

// 4. teclado: espacio / flechas
await page.keyboard.press('Space'); await page.waitForTimeout(500);
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
await inv('teclado ');

// 5. click en el toggle de idioma (English)
const en = await page.$$('button');
for (const b of en) { const t = await b.innerText(); if (t.trim()==='English') { await b.click(); break; } }
await page.waitForTimeout(3500);
await inv('tras EN');
console.log('errores acumulados:', errs);
await page.screenshot({path:'verif-b-final.png', fullPage:false});
await browser.close();
