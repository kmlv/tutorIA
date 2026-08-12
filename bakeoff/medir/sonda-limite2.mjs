import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const sid = await page.evaluate(() => window.__tutoriaSesion.session_id ?? window.__tutoriaSesion.id);
console.log('SESSION_ID:', sid);
fs.writeFileSync(SP+'/sid2.txt', String(sid));
await page.click('#ask');
await page.waitForTimeout(500);

// Quemar 11 turnos contra el mismo endpoint real que usa el composer.
const burn = await page.evaluate(async (sid) => {
  const out = [];
  for (let i=1;i<=11;i++){
    const r = await fetch(`/api/session/${sid}/chat`, {method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({pregunta:`Calentamiento ${i}: por que baja la recta?`})});
    out.push((await r.json()).restantes);
  }
  return out;
}, sid);
console.log('restantes tras quemar:', burn.join(','));

async function enviarUI(txt){
  await page.fill('.composer-input', txt);
  await page.waitForTimeout(120);
  await page.evaluate(()=>document.querySelector('.composer-enviar').click());
  await page.waitForFunction(()=>{const b=document.querySelector('.composer-enviar');return b && !b.disabled;},null,{timeout:60000});
  await page.waitForTimeout(400);
  return await page.evaluate(()=>{
    const msgs=[...document.querySelectorAll('.dock .mensaje, .dock [class*=mensaje], .dock p, .dock li')].map(n=>n.textContent.trim()).filter(Boolean);
    const inp=document.querySelector('.composer-input');
    const btn=document.querySelector('.composer-enviar');
    const root=document.querySelector('[data-agotado]');
    return {ultimo: msgs.slice(-1)[0]||null,
            inputDisabled: inp?inp.disabled:null,
            inputPlaceholder: inp?inp.placeholder:null,
            btnDisabled: btn?btn.disabled:null,
            agotado: root?root.dataset.agotado:null,
            composerHTML: document.querySelector('.composer')?.outerHTML.slice(0,400)||null};
  });
}

console.log('\n--- turno 12 (el ultimo permitido) ---');
let r = await enviarUI('Turno doce: sigo con dudas sobre la pendiente.');
console.log('ultimo:', JSON.stringify(r.ultimo)); console.log('agotado=',r.agotado,'inputDisabled=',r.inputDisabled,'btnDisabled=',r.btnDisabled);

console.log('\n--- turno 13: MARCADOR_PERDIDO_UNO ---');
r = await enviarUI('MARCADOR_PERDIDO_UNO no entiendo la pendiente');
console.log('ultimo:', JSON.stringify(r.ultimo)); console.log('agotado=',r.agotado,'inputDisabled=',r.inputDisabled,'btnDisabled=',r.btnDisabled,'placeholder=',JSON.stringify(r.inputPlaceholder));
await page.screenshot({path:SP+'/limite-13.png'});

console.log('\n--- turno 14: MARCADOR_PERDIDO_DOS ---');
r = await enviarUI('MARCADOR_PERDIDO_DOS sigo sin entender');
console.log('ultimo:', JSON.stringify(r.ultimo)); console.log('agotado=',r.agotado);
console.log('composer:', r.composerHTML);
await page.screenshot({path:SP+'/limite-14.png'});
await browser.close();
