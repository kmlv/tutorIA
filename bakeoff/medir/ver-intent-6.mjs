import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));

// --- EN: mismos botones, mismo silencio
await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();');
await page.waitForSelector('.q', {timeout:25000});
await page.evaluate(() => { const b=Array.from(document.querySelectorAll('.dock-acciones .intencion')).find(x=>/don't get it/i.test(x.textContent)); b&&b.click(); });
await page.waitForTimeout(10000);
console.log('EN dock tras "I dont get it" + 10s:');
console.log((await page.evaluate(() => Array.from(document.querySelectorAll('.dock-body > *')).map(e=>e.className+' :: '+e.textContent.trim().replace(/\s+/g,' ').slice(0,90)))).join('\n'));

// --- agotar el presupuesto de preguntas
console.log('\n########## agotando el presupuesto del composer');
for (let i=0;i<15;i++) {
  const agotado = await page.evaluate(() => document.querySelector('.composer')?.dataset.agotado === '1');
  if (agotado) break;
  await page.fill('.composer-input', `Pregunta ${i+1}`);
  await page.click('.composer-enviar');
  await page.waitForFunction(() => !document.querySelector('.composer-input').disabled, null, {timeout:30000}).catch(()=>{});
  const c = await page.evaluate(() => document.querySelector('.composer-restantes')?.textContent);
  console.log(`  q${i+1}: contador="${c}"`);
}
const est = await page.evaluate(() => {
  const inp = document.querySelector('.composer-input'); const b=document.querySelector('.composer-enviar');
  const cs = getComputedStyle(inp);
  return { agotado: document.querySelector('.composer').dataset.agotado, contador: document.querySelector('.composer-restantes').textContent,
           pointerEvents: cs.pointerEvents, opacity: cs.opacity, inputDisabled: inp.disabled, botonDisabled: b.disabled,
           intenciones: Array.from(document.querySelectorAll('.dock-acciones .intencion')).map(x=>x.textContent.trim()) };
});
console.log('\nESTADO CON PRESUPUESTO AGOTADO:', JSON.stringify(est,null,1));
// intentar escribir de verdad (click real, no evaluate)
try { await page.click('.composer-input', {timeout:3000}); await page.keyboard.type('socorro'); console.log('  valor tras teclear:', JSON.stringify(await page.inputValue('.composer-input'))); }
catch(e){ console.log('  NO se puede ni hacer clic en el input:', String(e).split('\n')[0].slice(0,90)); }
// y pulsar una intencion
const antes = await page.evaluate(() => document.querySelectorAll('.dock-body .msg.tutor').length);
await page.click('.dock-acciones .intencion');  // "I don't get it"
await page.waitForTimeout(12000);
const despues = await page.evaluate(() => document.querySelectorAll('.dock-body .msg.tutor').length);
console.log(`  msgs tutor antes=${antes} despues=${despues}  -> ${antes===despues?'NINGUNA RESPUESTA':'respondio'}`);
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/ver-int-agotado.png'});
await browser.close();
