import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&t=84', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1000);

const ct = () => page.evaluate(()=>+window.__tutoria.media.currentTime().toFixed(2));
const est = () => page.evaluate(()=>JSON.stringify(window.__tutoria.estado().mostrar));

console.log('inicial ct=', await ct(), await est());
// 1) teclado
for (const k of ['ArrowRight','ArrowLeft','l','j','Period','Space']) {
  await page.keyboard.press(k==='Space'?' ':k);
  await page.waitForTimeout(300);
  console.log('  tecla', k, '-> ct=', await ct());
}
// pausar si se puso a andar
await page.evaluate(()=>window.__tutoria.media.pause());
await page.evaluate(()=>window.__tutoria.media.seek(0)).catch(()=>{});
await page.waitForTimeout(300);

// 2) transcripción: ¿hay panel con líneas clicables?
const tr = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('button,[role=button],a,li,summary,details')]
    .map(e=>({tag:e.tagName, cls:e.className, txt:e.textContent.trim().replace(/\s+/g,' ').slice(0,60)}))
    .filter(x=>x.txt);
  return cands.slice(0,40);
});
console.log('=== clicables ===', JSON.stringify(tr,null,1));

// abrir transcripción y ver si sus líneas hacen seek
const trBtn = await page.$('text=Transcripción');
if (trBtn) { await trBtn.click(); await page.waitForTimeout(600); }
const tr2 = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.transcripcion *, [class*=transcri] *')].slice(0,30)
    .map(e=>({tag:e.tagName, cls:e.className, dataset:{...e.dataset}, txt:e.textContent.trim().slice(0,50)}));
  return els;
});
console.log('=== transcripcion tras click ===', JSON.stringify(tr2,null,1));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v84c-transcript.png', fullPage:true});

// 3) click sobre el reloj / la banda de subtítulos / la barra de progreso invisible
const antes = await ct();
for (const sel of ['.reloj','.tiempo','.captions-band','.bands','.controles']) {
  const el = await page.$(sel);
  if (!el) { console.log('  no existe', sel); continue; }
  const box = await el.boundingBox();
  if (!box) { console.log('  sin caja', sel); continue; }
  await page.mouse.click(box.x + box.width*0.6, box.y + box.height/2);
  await page.waitForTimeout(400);
  console.log('  click', sel, 'ct=', await ct());
}
console.log('ct final', await ct(), 'antes', antes);
await browser.close();
