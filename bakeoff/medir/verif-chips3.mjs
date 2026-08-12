import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const sid = await page.evaluate('window.__tutoriaSesion.session_id');
// quemar 12 turnos por el mismo endpoint que usa el composer
const rest = await page.evaluate(async (sid) => {
  let last = null;
  for (let i=0;i<12;i++){
    const r = await fetch(`/api/session/${sid}/chat`, {method:'POST',headers:{'content-type':'application/json'},
      body: JSON.stringify({pregunta: `pregunta ${i+1}: no entiendo nada`})});
    last = await r.json();
  }
  return last;
}, sid);
console.log('tras 12 turnos, restantes =', rest.restantes);
// ahora a la prediccion
await page.evaluate('window.__tutoria.media.seek(84); window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:30000});
console.log('reloj=', await page.evaluate('document.getElementById("reloj").textContent'));
// chip
await page.click('.dock-acciones button:text-is("No entiendo")');
await page.waitForTimeout(8000);
// composer con cupo agotado
await page.fill('.composer-input', '¿Me lo explicas otra vez?');
await page.click('.composer-enviar');
await page.waitForTimeout(8000);
console.log('historial final:');
for (const m of await page.$$eval('.dock-body .msg', p=>p.map(x=>x.className+' :: '+x.textContent.trim()))) console.log('   ', m.slice(0,180));
console.log('acciones visibles:', JSON.stringify(await page.$$eval('.dock-acciones button', b=>b.map(x=>x.textContent.trim()))));
console.log('opciones pregunta:', JSON.stringify(await page.$$eval('.q-opciones button', b=>b.map(x=>x.textContent.trim()))));
console.log('composer sigue habilitado?', await page.evaluate('!document.querySelector(".composer-input").disabled'));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-chips-cupo.png'});
await browser.close();
