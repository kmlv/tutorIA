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
await page.click('#ask');
await page.waitForTimeout(500);

async function preguntar(txt, espera=45000) {
  await page.fill('.composer-input', txt);
  const n = await page.locator('.dock-body .msg').count();
  await page.click('.composer-enviar');
  await page.waitForFunction(`document.querySelectorAll(".dock-body .msg").length > ${n+1}`, null, {timeout: espera}).catch(()=>{});
  await page.waitForTimeout(800);
  return page.locator('.composer-restantes').first().textContent();
}

console.log('P1 ->', await preguntar('¿Qué es la recta de presupuesto?'));

// El servidor SÍ recibe y procesa; la respuesta se pierde de vuelta.
await page.route('**/chat', async r => {
  try { await r.fetch(); } catch(e) { console.log(' fetch interno:', String(e).slice(0,80)); }
  await r.abort('failed');
});
const larga = 'Llevo media hora atascado con esto: entiendo que el ingreso limita lo que puedo comprar, pero no veo por qué la recta es recta y no curva. ¿Me lo explicas?';
await page.fill('.composer-input', larga);
await page.click('.composer-enviar');
await page.waitForTimeout(25000);
const tras = await page.evaluate(() => ({
  input: document.querySelector('.composer-input').value,
  contador: document.querySelector('.composer-restantes').textContent,
  ult: [...document.querySelectorAll('.dock-body .msg')].slice(-2).map(m=>m.className+' :: '+m.textContent.slice(0,90)),
}));
console.log('=== respuesta perdida de vuelta ===');
console.log(JSON.stringify(tras, null, 1));

// ¿el servidor gastó el turno? preguntamos de verdad y miramos el salto
await page.unroute('**/chat');
console.log('P3 (real) ->', await preguntar('¿Y por qué la pendiente es negativa?'));

// ¿es copiable el texto del alumno desde el historial?
const copiable = await page.evaluate(() => {
  const p = [...document.querySelectorAll('.dock-body .msg.estudiante')].find(x=>x.textContent.startsWith('Llevo media hora'));
  if (!p) return 'no encontrado';
  const cs = getComputedStyle(p);
  return {userSelect: cs.userSelect || cs.webkitUserSelect, texto: p.textContent.length};
});
console.log('copiable:', JSON.stringify(copiable));
await browser.close();
