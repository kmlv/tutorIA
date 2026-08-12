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
console.log('cargado, duration=', await page.evaluate('window.__tutoria.media.duration()'));

// pulsar "Preguntar" (#ask)
const ask = await page.$('#ask');
console.log('#ask existe:', !!ask, 'texto:', ask ? (await ask.innerText()).replace(/\n/g,' ') : null);
await ask.click();
await page.waitForTimeout(600);
console.log('composer visible:', await page.isVisible('.composer-input'));

// snapshot ANTES de enviar
const antes = await page.evaluate(() => {
  const i = document.querySelector('.composer-input');
  const b = document.querySelector('.composer-enviar');
  const cs = getComputedStyle(i);
  return {disabled:i.disabled, opacity:cs.opacity, bg:cs.backgroundColor, color:cs.color,
          cursor:cs.cursor, focoEsInput: document.activeElement===i,
          botonTexto:b.textContent, botonDisabled:b.disabled};
});
console.log('ANTES de enviar:', JSON.stringify(antes));

// escribir la pregunta como un alumno
await page.click('.composer-input');
await page.keyboard.type('por que la recta baja', {delay: 20});
console.log('valor escrito:', await page.$eval('.composer-input', e=>e.value));

// enviar con Enter (el foco se queda en la caja)
const t0 = Date.now();
await page.keyboard.press('Enter');

// muestrear inmediatamente el estado ocupado
await page.waitForTimeout(120);
const durante = await page.evaluate(() => {
  const i = document.querySelector('.composer-input');
  const b = document.querySelector('.composer-enviar');
  const cs = getComputedStyle(i);
  return {disabled:i.disabled, opacity:cs.opacity, bg:cs.backgroundColor, color:cs.color,
          cursor:cs.cursor, borde:cs.borderColor,
          activeElement: document.activeElement ? document.activeElement.className || document.activeElement.tagName : null,
          botonTexto:b.textContent, botonDisabled:b.disabled, valor:i.value};
});
console.log('DURANTE (t+120ms):', JSON.stringify(durante));

// AHORA: el alumno sigue tecleando mientras piensa
const frase = 'esto lo escribo mientras piensa';
await page.keyboard.type(frase, {delay: 25});
const trasTeclear = await page.evaluate(() => {
  const i = document.querySelector('.composer-input');
  return {valor: i.value, disabled: i.disabled,
          activeElement: document.activeElement ? (document.activeElement.className||document.activeElement.tagName) : null,
          bodyText: document.body.innerText.includes('mientras piensa')};
});
console.log('TRAS TECLEAR', frase.length, 'chars:', JSON.stringify(trasTeclear));

// esperar a que termine el busy
await page.waitForFunction('!document.querySelector(".composer-input").disabled', null, {timeout:60000});
const dt = Date.now()-t0;
console.log('busy duró ms:', dt);
const despues = await page.evaluate(() => {
  const i = document.querySelector('.composer-input');
  const b = document.querySelector('.composer-enviar');
  const burbujas = [...document.querySelectorAll('.dock *')].map(e=>e.className).slice(0,0);
  return {valor:i.value, disabled:i.disabled, botonTexto:b.textContent,
          activeElement: document.activeElement ? (document.activeElement.className||document.activeElement.tagName) : null,
          dockTexto: (document.querySelector('.dock')?.innerText||'').slice(0,600)};
});
console.log('DESPUES:', JSON.stringify(despues, null, 1));
await page.screenshot({path:'/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/despues.png'});
await browser.close();
