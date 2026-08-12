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
page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERROR:', m.text().slice(0,160)); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('cargado. dock=', await page.evaluate('window.__tutoria.dock.actual'));

// 1) pulsar Preguntar
await page.click('#ask');
await page.waitForTimeout(600);
console.log('tras #ask: dock=', await page.evaluate('window.__tutoria.dock.actual'));
const hayComposer = await page.locator('.composer-input').count();
console.log('composer inputs:', hayComposer);
console.log('contador inicial:', JSON.stringify(await page.locator('.composer-restantes').first().textContent()));

// 2) pregunta normal, que funciona
await page.fill('.composer-input', '¿Qué es la recta de presupuesto?');
const t0 = Date.now();
await page.click('.composer-enviar');
try {
  await page.waitForFunction(
    'document.querySelectorAll(".dock-body .msg.tutor").length >= 1', null, {timeout:60000});
} catch(e) { console.log('  timeout esperando respuesta'); }
await page.waitForTimeout(1500);
console.log('latencia ~', Date.now()-t0, 'ms');
const msgs = await page.locator('.dock-body .msg').allTextContents();
console.log('mensajes tras 1a pregunta:', JSON.stringify(msgs, null, 1).slice(0,800));
console.log('contador tras 1a:', JSON.stringify(await page.locator('.composer-restantes').first().textContent()));
console.log('input tras 1a:', JSON.stringify(await page.inputValue('.composer-input')));

// 3) provocar fallo de red
await page.route('**/chat', r => r.abort('failed'));
const larga = 'Llevo media hora atascado con esto: entiendo que el ingreso limita lo que puedo comprar, pero no veo por qué la recta es recta y no curva. ¿Me lo explicas?';
console.log('chars pregunta larga:', larga.length);
await page.fill('.composer-input', larga);
console.log('input antes de enviar:', JSON.stringify(await page.inputValue('.composer-input')).length);
await page.click('.composer-enviar');
await page.waitForTimeout(3000);

const estado = await page.evaluate(() => {
  const inp = document.querySelector('.composer-input');
  const cont = document.querySelector('.composer-restantes');
  const form = document.querySelector('.composer');
  const msgs = [...document.querySelectorAll('.dock-body .msg')].map(m => m.className + ' :: ' + m.textContent);
  return {
    inputValue: inp ? inp.value : null,
    inputLen: inp ? inp.value.length : null,
    inputDisabled: inp ? inp.disabled : null,
    focoEnInput: document.activeElement === inp,
    contador: cont ? cont.textContent : null,
    agotado: form ? form.dataset.agotado : null,
    botonTexto: document.querySelector('.composer-enviar')?.textContent,
    botonDisabled: document.querySelector('.composer-enviar')?.disabled,
    msgs,
  };
});
console.log('=== TRAS FALLO ===');
console.log(JSON.stringify(estado, null, 1));

// 4) ¿hay forma de recuperar? probar flecha arriba / re-enviar vacío
await page.click('.composer-input');
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(200);
console.log('input tras ArrowUp:', JSON.stringify(await page.inputValue('.composer-input')));
await page.keyboard.press('Control+z');
await page.waitForTimeout(200);
console.log('input tras Ctrl+Z:', JSON.stringify(await page.inputValue('.composer-input')));

// 5) ¿se gastó el turno? quitar el route y preguntar de nuevo
await page.unroute('**/chat');
await page.fill('.composer-input', '¿Y por qué la pendiente es negativa?');
await page.click('.composer-enviar');
await page.waitForTimeout(20000);
console.log('contador tras 3a (real):', JSON.stringify(await page.locator('.composer-restantes').first().textContent()));
const msgs2 = await page.locator('.dock-body .msg').allTextContents();
console.log('total mensajes:', msgs2.length);
console.log('ultimos:', JSON.stringify(msgs2.slice(-3), null, 1).slice(0,600));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/perdida-texto.png'});
await browser.close();
