// Tercera parte: en el tope de 40, SIN tocar nada mas, ¿el chat libre es una salida real y VISIBLE?
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/verif-ciclo3.json';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const log={jsErrors:[]};
page.on('pageerror', e => log.jsErrors.push(String(e).slice(0,300)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(()=>{ const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play(); });
async function press(key,n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(80); }
let lastCount=0;
for (let i=0;i<40;i++){
  try { await page.waitForFunction((n)=>document.querySelectorAll('.dock-body .pregunta').length>n, lastCount, {timeout:15000}); } catch { break; }
  lastCount = await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(200);
  const q = await page.evaluate(()=>{const ps=document.querySelectorAll('.dock-body .pregunta');const l=ps[ps.length-1];
    return {cls:l.querySelector('.q').className, n:l.querySelectorAll('.q-opcion').length};});
  const m = q.cls.includes('q-mcq')?'mcq': q.cls.includes('q-numeric')?'numeric': q.cls.includes('q-manip')?'manip':'?';
  if(m==='mcq') await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(q.n-1).click();
  else if(m==='numeric'){ await page.locator('.dock-body .pregunta').last().locator('.q-input').fill('999');
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click(); }
  else if(m==='manip'){ await press('ArrowDown',20); await page.locator('.dock-body .pregunta').last().locator('button.primario').click(); }
  await page.waitForTimeout(1500); process.stdout.write('.');
}
console.log('\n--- en el tope ---');
log.enTope = {
  dockEstado: await page.evaluate(()=>window.__tutoria.dock?.actual),
  frasesCierre: await page.evaluate(()=>document.body.innerText.includes('Eso es todo por ahora')),
  botonesVivosBody: await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body button:not([disabled])')).length),
  // ¿el boton Preguntar esta dentro de la ventana?
  enviarRect: await page.evaluate(()=>{const b=document.querySelector('.composer-enviar'); if(!b) return null; const r=b.getBoundingClientRect();
    return {top:Math.round(r.top), bottom:Math.round(r.bottom), alto:window.innerHeight, dentro: r.top>=0 && r.bottom<=window.innerHeight};}),
  inputRect: await page.evaluate(()=>{const b=document.querySelector('.composer-input'); if(!b) return null; const r=b.getBoundingClientRect();
    return {top:Math.round(r.top), bottom:Math.round(r.bottom), alto:window.innerHeight, dentro: r.top>=0 && r.bottom<=window.innerHeight};}),
};
console.log('en el tope:', JSON.stringify(log.enTope));
await page.screenshot({path: OUT.replace('.json','-tope.png')});

// Chat libre, sin tocar nada mas
const antes = await page.evaluate(()=>document.querySelectorAll('.dock-body > *').length);
await page.locator('.composer-input').fill('sigo sin entender, explicamelo de otra forma');
let via='click';
try { await page.locator('.composer-enviar').click({timeout:4000}); }
catch { via='CLICK IMPOSIBLE -> Enter'; await page.locator('.composer-input').press('Enter'); }
await page.waitForTimeout(14000);
const nodos = await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body > *')).map(n=>({cls:n.className, txt:n.textContent.trim().slice(0,220)})));
log.chat = {via, nodosNuevos: nodos.length-antes, nuevos: nodos.slice(antes),
  dockEstado: await page.evaluate(()=>window.__tutoria.dock?.actual),
  ultimoVisible: await page.evaluate(()=>{const ns=document.querySelectorAll('.dock-body > *'); const l=ns[ns.length-1]; if(!l) return null;
    const r=l.getBoundingClientRect(); const cs=getComputedStyle(l);
    return {top:Math.round(r.top), bottom:Math.round(r.bottom), alto:window.innerHeight, display:cs.display, visibility:cs.visibility,
            dentroVentana: r.bottom>0 && r.top<window.innerHeight};})};
console.log('chat:', JSON.stringify(log.chat).slice(0,900));
await page.screenshot({path: OUT.replace('.json','-traschat.png')});
fs.writeFileSync(OUT, JSON.stringify(log,null,1));
console.log('jsErrors:', log.jsErrors.length);
await browser.close();
