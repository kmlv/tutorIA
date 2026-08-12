import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:20000}); await page.waitForTimeout(600);
const o = await page.$$('.q-opciones button'); await o[1].click(); await page.waitForTimeout(1500);

// agotar la cuota
for (let i=1;i<=13;i++){
  const dis = await page.evaluate(()=>document.querySelector('.composer-enviar')?.disabled);
  const inpDis = await page.evaluate(()=>document.querySelector('.composer-input')?.disabled);
  if (dis || inpDis) { console.log(`pregunta ${i}: composer BLOQUEADO (enviar=${dis} input=${inpDis})`); break; }
  await page.fill('.composer-input', 'pregunta numero '+i);
  await page.click('.composer-enviar');
  await page.waitForTimeout(4500);
  const cont = await page.evaluate(()=>{const e=[...document.querySelectorAll('.dock *')].map(x=>x.textContent).find(t=>/pregunta[s]?$/.test((t||'').trim()));return e;});
  console.log(`  enviada ${i}; contador="${(cont||'').trim()}"`);
}
await page.waitForTimeout(1500);
const fin = await page.evaluate(()=>({
  composerDis: document.querySelector('.composer-enviar')?.disabled,
  inputDis: document.querySelector('.composer-input')?.disabled,
  dockTail: document.querySelector('.dock')?.innerText.trim().slice(-700),
  chips: [...document.querySelectorAll('.dock button.intencion')].map(b=>({t:b.textContent.trim(),d:b.disabled})),
  t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
}));
console.log('\n=== ESTADO CON CUOTA AGOTADA ==='); console.log(JSON.stringify(fin,null,1));
await page.screenshot({path:OUT+'/v6-cuota.png'});

// existe todavia "Listo, sigamos" y funciona?
const lb = await page.$('.dock button:has-text("Listo, sigamos")');
console.log('\n"Listo, sigamos" existe:', !!lb);
if (lb){ await lb.click(); await page.waitForTimeout(4000);
  console.log('tras Listo: t=',await page.evaluate('window.__tutoria.media.currentTime()'),
    'paused=',await page.evaluate('window.__tutoria.media.paused()')); }
// tambien el boton Seguir del reproductor
console.log('boton Seguir existe:', !!(await page.$('button.primario:has-text("Seguir")')));
await page.waitForTimeout(14000);
console.log('t final=', await page.evaluate('window.__tutoria.media.currentTime()'),
  ' caption=', await page.evaluate(()=>document.querySelector('.captions-band')?.innerText.split('\n')[0]));
console.log('ERRS',errs);
await browser.close();
