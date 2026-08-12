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
    t: +window.__tutoria.media.currentTime().toFixed(2),
    paused: window.__tutoria.media.paused(),
    dock: window.__tutoria.dock ? window.__tutoria.dock.actual : null,
    qHtml: document.querySelector('.q') ? document.querySelector('.q').innerText.replace(/\n+/g,' | ').slice(0,300) : null,
    dockText: document.querySelector('.dock') ? document.querySelector('.dock').innerText.replace(/\n+/g,' | ').slice(0,600) : null,
    botones: [...document.querySelectorAll('.dock button, .q button')].map(b=>b.innerText.trim()).filter(Boolean),
  }));
  console.log(`[${tag}] t=${s.t} paused=${s.paused} dock=${JSON.stringify(s.dock)}`);
  console.log(`   Q: ${s.qHtml}`);
  console.log(`   DOCK: ${s.dockText}`);
  console.log(`   BTN: ${JSON.stringify(s.botones)}`);
  return s;
};

console.log('=== CASO A: cp2, seek 193.5, play, esperar checkpoint ===');
await page.evaluate(() => { window.__tutoria.media.seek(193.5); window.__tutoria.media.play(); });
// esperar a que se pause solo
await page.waitForFunction('window.__tutoria.media.paused() === true', null, {timeout:20000}).catch(()=>console.log('  (no se pauso solo en 20s)'));
await page.waitForTimeout(600);
await snap('llega al checkpoint');

// escribir en el composer
const inp = await page.$('.composer-input');
console.log('composer-input existe:', !!inp);
if (inp) {
  await inp.click();
  await inp.fill('cualquier cosa');
  await page.waitForTimeout(200);
  const btns = await page.evaluate(()=>[...document.querySelectorAll('button')].map((b,i)=>i+':'+b.innerText.trim()).filter(x=>x.split(':')[1]));
  console.log('todos los botones:', JSON.stringify(btns));
  // pulsar Responder / composer-enviar
  const target = await page.$('.composer-enviar');
  console.log('composer-enviar existe:', !!target);
  const tAntes = await page.evaluate(()=>+window.__tutoria.media.currentTime().toFixed(2));
  await target.click();
  console.log('t justo antes del click:', tAntes);
  for (const ms of [300, 1000, 3000, 5000, 10000, 15000, 30000]) {
    await page.waitForTimeout(ms === 300 ? 300 : 0);
    if (ms > 300) await page.waitForTimeout(0);
  }
  // muestreo temporal
  for (let i=0;i<11;i++){
    await page.waitForTimeout(i===0?400:3000);
    const s = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), p:window.__tutoria.media.paused(),
      dock: document.querySelector('.dock') ? document.querySelector('.dock').innerText.replace(/\n+/g,' | ').slice(0,400):null,
      btn:[...document.querySelectorAll('.dock button, .q button')].map(b=>b.innerText.trim()).filter(Boolean)}));
    console.log(`  +${(i===0?0.4:0.4+i*3).toFixed(1)}s  t=${s.t} paused=${s.p} btn=${JSON.stringify(s.btn)}`);
    if (i===0 || i===10) console.log(`      DOCK: ${s.dock}`);
  }
}
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v-casoA.png'});
await browser.close();
