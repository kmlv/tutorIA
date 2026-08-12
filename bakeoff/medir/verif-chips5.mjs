import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
let logEvents = true;
page.on('request', r => { if (r.method()==='POST' && r.url().endsWith('/events') && logEvents) console.log('  EVENTS BODY:', (r.postData()||'').slice(0,400)); });
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#play'); await page.waitForTimeout(1500);
await page.click('#ask'); await page.waitForTimeout(500);
console.log('>>> payload del evento al pulsar el chip:');
await page.click('.dock-acciones button.intencion:text-is("No entiendo")');
await page.waitForTimeout(2500);
logEvents = false;

// Agotar el presupuesto de 12 preguntas por el composer
console.log('\n>>> agotando presupuesto...');
for (let i=0;i<13;i++) {
  const ago = await page.$eval('.composer', e=>e.getAttribute('data-agotado')).catch(()=>null);
  if (ago === '1') { console.log('   composer agotado en la iteracion', i); break; }
  await page.fill('.composer-input', `pregunta numero ${i+1}`);
  const p = page.waitForResponse(r=>r.url().includes('/chat'), {timeout:60000}).catch(()=>null);
  await page.click('.composer-enviar');
  const res = await p;
  if (res) { const j = await res.json().catch(()=>({})); console.log(`   q${i+1} -> restantes=${j.restantes} limite=${j.limite_alcanzado}`); }
  await page.waitForTimeout(400);
}
const st = await page.evaluate(() => {
  const c = document.querySelector('.composer');
  const ta = document.querySelector('.composer-input');
  const cs = getComputedStyle(c);
  const chips = Array.from(document.querySelectorAll('.dock-acciones button.intencion')).map(b=>({t:b.textContent.trim(), disabled:b.disabled, pe:getComputedStyle(b).pointerEvents, op:getComputedStyle(b).opacity}));
  return {agotado:c.getAttribute('data-agotado'), opacity:cs.opacity, pe:cs.pointerEvents, taDisabled:ta && ta.disabled, restantes:(document.querySelector('.composer-restantes')||{}).textContent, chips};
});
console.log('\n>>> estado tras agotar:', JSON.stringify(st,null,1));
const antes = await page.$eval('.dock-body', e=>e.children.length);
await page.click('.dock-acciones button.intencion:text-is("No entiendo")', {timeout:5000}).then(()=>console.log('   chip CLICABLE con presupuesto agotado')).catch(e=>console.log('   chip no clicable:', String(e).slice(0,80)));
await page.waitForTimeout(8000);
const desp = await page.$eval('.dock-body', e=>Array.from(e.children).map(c=>`[${c.className}] ${(c.textContent||'').trim().slice(0,80)}`));
console.log('   msgs antes=', antes, ' despues=', desp.length);
console.log('   ultimos:', desp.slice(-3).join(' || '));
await page.screenshot({path:'v-agotado-chips.png'});
await browser.close();
