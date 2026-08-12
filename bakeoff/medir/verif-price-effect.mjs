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

const snap = async (tag) => {
  const s = await page.evaluate(() => ({
    t: window.__tutoria.media.currentTime(),
    paused: window.__tutoria.media.paused(),
    estado: window.__tutoria.estado(),
    bands: document.querySelector('.bands')?.innerText.replace(/\n+/g,' | ') || null,
    q: document.querySelector('.q-enunciado')?.innerText || null,
    ops: [...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\n/g,' ')),
    caps: document.querySelector('.captions-band')?.innerText.replace(/\n+/g,' ') || null,
    dock: window.__tutoria.dock?.actual ?? null,
  }));
  console.log(`\n=== ${tag} @ t=${s.t?.toFixed(2)} paused=${s.paused}`);
  console.log('  estado:', JSON.stringify(s.estado));
  console.log('  bands :', s.bands);
  if (s.q) console.log('  Q     :', s.q);
  if (s.ops.length) s.ops.forEach((o,i)=>console.log(`   op${i}: ${o}`));
  if (s.caps) console.log('  caps  :', s.caps.slice(0,300));
  return s;
};

// buscar el boton Empezar
const botones = await page.evaluate(() => [...document.querySelectorAll('button')].map((b,i)=>({i, txt:b.innerText.replace(/\n/g,' ').slice(0,40), id:b.id, cls:b.className})));
console.log('BOTONES:', JSON.stringify(botones));

await snap('carga limpia');

// Empezar
const emp = page.locator('button', {hasText: /Empezar/i}).first();
if (await emp.count()) { await emp.click(); console.log('>> click Empezar'); }
else { await page.click('#play'); console.log('>> click #play'); }

await page.waitForTimeout(2000);
await snap('tras Empezar');

// esperar hasta justo antes del income_shift
await page.waitForFunction('window.__tutoria.media.currentTime() > 150', null, {timeout: 400000});
await snap('t~150 antes de income_shift');
await page.waitForFunction('window.__tutoria.media.currentTime() > 160', null, {timeout: 60000});
await snap('t~160 tras income_shift');

// esperar a que aparezca la pregunta price_effect
await page.waitForFunction('window.__tutoria.media.currentTime() > 176.2 || document.querySelector(".q-opciones button")', null, {timeout: 120000});
await page.waitForTimeout(800);
const antes = await snap('PREGUNTA price_effect (antes de responder)');
await page.screenshot({path:'verif-antes.png'});

// pulsar la opcion correcta: "Gira: el intercepto del jugo no se mueve"
const ops = await page.$$('.q-opciones button');
let idx = -1, txts = [];
for (let i=0;i<ops.length;i++){ const t = (await ops[i].innerText()).replace(/\n/g,' '); txts.push(t); if (/gira/i.test(t) && /no se mueve|no cambia|clavado|se queda/i.test(t)) idx = i; }
console.log('OPCIONES:', JSON.stringify(txts), 'elegida idx', idx);
if (idx < 0) idx = 0;
await ops[idx].click();
console.log('>> click opcion', idx, txts[idx]);
await page.waitForTimeout(400);
const dsp = await snap('INMEDIATAMENTE tras responder');
await page.screenshot({path:'verif-despues.png'});
await page.waitForTimeout(1500);
await snap('+2s tras responder');

// dejar correr hasta 3:03 = 183s
await page.waitForFunction('window.__tutoria.media.currentTime() > 183 || window.__tutoria.media.paused()===false && false', null, {timeout: 120000}).catch(e=>console.log('  (no llego a 183:', String(e).slice(0,80),')'));
await snap('t~183 (3:03)');
await page.screenshot({path:'verif-183.png'});
await page.waitForTimeout(4000);
await snap('t~187');
await browser.close();
