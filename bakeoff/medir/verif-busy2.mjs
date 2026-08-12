import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#ask'); await page.waitForTimeout(600);

const comp = await page.$('.composer');
await comp.screenshot({path: SP+'/c-antes-vacio.png'});

await page.click('.composer-input');
await page.keyboard.type('por que la recta baja', {delay:15});
await comp.screenshot({path: SP+'/c-escrito.png'});

// estado del reproductor antes
const mediaAntes = await page.evaluate(()=>({paused:window.__tutoria.media.paused(), t:window.__tutoria.media.currentTime()}));

await page.keyboard.press('Enter');
await page.waitForTimeout(150);
await comp.screenshot({path: SP+'/c-ocupado.png'});

// teclear durante el busy con espacios y flechas (posibles atajos globales)
await page.keyboard.type('esto lo escribo mientras piensa', {delay:25});
await page.keyboard.press('ArrowRight');
await page.keyboard.press('Space');
const durante = await page.evaluate(()=>({
  valor: document.querySelector('.composer-input').value,
  active: document.activeElement.className||document.activeElement.tagName,
  paused: window.__tutoria.media.paused(), t: window.__tutoria.media.currentTime(),
  dockLen: (document.querySelector('.dock')?.innerText||'').length,
}));
console.log('mediaAntes:', JSON.stringify(mediaAntes));
console.log('DURANTE:', JSON.stringify(durante));

await page.waitForFunction('!document.querySelector(".composer-input").disabled', null, {timeout:60000});
await page.waitForTimeout(100);
await comp.screenshot({path: SP+'/c-despues.png'});

// ¿el alumno recupera el foco automáticamente y puede reescribir?
await page.keyboard.type('segunda pregunta', {delay:20});
console.log('tras busy, escribe bien:', JSON.stringify(await page.$eval('.composer-input', e=>e.value)));

// diff de píxeles antes-de-enviar(vacio) vs ocupado
const A = fs.readFileSync(SP+'/c-antes-vacio.png'), B = fs.readFileSync(SP+'/c-ocupado.png');
console.log('bytes antes/ocupado:', A.length, B.length, 'identicos:', A.equals(B));
await browser.close();
