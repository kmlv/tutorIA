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
const posts = [];
page.on('request', r => { if (r.url().includes('/chat') && r.method()==='POST') posts.push(r.url()); });
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => window.__tutoria.media.pause());
await page.click('#ask'); await page.waitForTimeout(400);

// etiqueta accesible del contador y del composer, en su estado normal
console.log('a11y contador:', JSON.stringify(await page.evaluate(() => {
  const c = document.querySelector('.composer-restantes');
  const i = document.querySelector('.composer-input');
  return {html: c.outerHTML, aria: c.getAttribute('aria-label'), title: c.getAttribute('title'),
          role: c.getAttribute('role'), live: c.getAttribute('aria-live'),
          inputAria: i.getAttribute('aria-label'), inputLabelledby: i.getAttribute('aria-labelledby')};
})));

// reproducir el estado agotado tal como lo deja el servidor (visto de verdad en la corrida anterior)
await page.evaluate(() => {
  document.querySelector('.composer').dataset.agotado = '1';
  document.querySelector('.composer-restantes').textContent = '0 preguntas';
});
console.log('estado montado:', JSON.stringify(await page.evaluate(() => {
  const i = document.querySelector('.composer-input');
  return {disabled: i.disabled, ariaDisabled: i.getAttribute('aria-disabled'),
          readOnly: i.readOnly, tabIndex: i.tabIndex, pe: getComputedStyle(i).pointerEvents};
})));

// ¿se puede llegar con el teclado y escribir?
await page.evaluate(() => document.querySelector('.composer-input').focus());
const enfocado = await page.evaluate(() => document.activeElement.className);
console.log('activeElement tras focus():', enfocado);
await page.keyboard.type('sigo pudiendo escribir aunque diga 0');
console.log('valor escrito con teclado:', JSON.stringify(await page.evaluate(() => document.querySelector('.composer-input').value)));
const antesPosts = posts.length;
await page.keyboard.press('Enter');
await page.waitForTimeout(2500);
console.log('POSTs a /chat tras Enter:', posts.length - antesPosts);
console.log('estado final:', JSON.stringify(await page.evaluate(() => {
  const msgs=[...document.querySelectorAll('.dock .msg')];
  return {contador: document.querySelector('.composer-restantes').textContent,
          ultimos: msgs.slice(-2).map(m=>m.className+' :: '+m.textContent.trim().slice(0,110))};
}), null, 1));
// ¿se puede llegar por Tab desde el boton de enviar? (pointer-events no bloquea el tabulador)
await page.evaluate(() => document.querySelector('.intencion')?.focus());
for (let i=0;i<12;i++){ await page.keyboard.press('Tab');
  const el = await page.evaluate(() => document.activeElement.className+'|'+document.activeElement.tagName);
  if (el.includes('composer')) { console.log(`Tab #${i+1} llega a:`, el); break; }
}
await browser.close();
