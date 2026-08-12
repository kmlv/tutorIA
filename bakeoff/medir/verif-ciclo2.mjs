// Segunda parte: llegar al tope de 40 y probar TODO lo que le queda al alumno.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync('/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe/key.json','utf8'));
const OUT = '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/verif-ciclo2.json';

const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const log = {jsErrors:[], net:[], post:[]};
page.on('pageerror', e => { log.jsErrors.push(String(e).slice(0,400)); console.log('  JS ERROR:', String(e).slice(0,200)); });
page.on('response', async r => { const u=r.url(); if(u.includes('/api/')){ let b=null; try{b=(await r.text()).slice(0,600);}catch{} log.net.push({url:u.replace('http://localhost:57330',''),status:r.status(),body:b, t:Date.now()}); }});

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(()=>{ const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play(); });

const dockText = () => page.evaluate(()=> Array.from(document.querySelectorAll('.dock-body > *')).map(n=>({cls:n.className, txt:n.textContent.trim().slice(0,200)})));
async function press(key, n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(80); }

let lastCount = 0;
for (let i=0;i<40;i++){
  try { await page.waitForFunction((n)=>document.querySelectorAll('.dock-body .pregunta').length > n, lastCount, {timeout: 15000}); }
  catch { console.log('#'+i+' timeout'); break; }
  lastCount = await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(200);
  const q = await page.evaluate(()=>{ const ps=document.querySelectorAll('.dock-body .pregunta'); const last=ps[ps.length-1];
    return {cls:last.querySelector('.q').className, n:last.querySelectorAll('.q-opcion').length}; });
  const modal = q.cls.includes('q-mcq')?'mcq': q.cls.includes('q-numeric')?'numeric': q.cls.includes('q-manip')?'manip':'?';
  if (modal==='mcq'){
    await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(q.n-1).click();
  } else if (modal==='numeric'){
    await page.locator('.dock-body .pregunta').last().locator('.q-input').fill('999');
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click();
  } else if (modal==='manip'){
    await press('ArrowDown',20);
    await page.locator('.dock-body .pregunta').last().locator('button.primario').click();
  }
  await page.waitForTimeout(1500);
  process.stdout.write('.');
}
console.log('\n--- tope alcanzado, esperando 12s por si aparece algo ---');
const antes = await dockText();
await page.waitForTimeout(12000);
const despues = await dockText();
log.nadaNuevoEn12s = JSON.stringify(antes)===JSON.stringify(despues);
console.log('nada nuevo en 12s:', log.nadaNuevoEn12s, '| nodos dock:', despues.length);

// 1) Botones de intencion
log.intentos = [];
const nombres = await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-acciones button')).map(b=>b.textContent.trim()));
console.log('acciones disponibles:', JSON.stringify(nombres));
for (const nom of nombres){
  const nAntes = (await dockText()).length;
  const netAntes = log.net.length;
  try { await page.locator('.dock-acciones button', {hasText: nom}).first().click({timeout:3000}); }
  catch(e){ log.intentos.push({nom, error:'no clicable'}); continue; }
  await page.waitForTimeout(4000);
  const d = await dockText();
  const nuevas = d.slice(nAntes).map(x=>x.txt);
  const netNuevo = log.net.slice(netAntes).map(n=>n.url);
  log.intentos.push({nom, nodosNuevos: d.length-nAntes, textoNuevo: nuevas, red: netNuevo});
  console.log(`  [${nom}] nodos nuevos=${d.length-nAntes} red=${JSON.stringify(netNuevo)} texto=${JSON.stringify(nuevas).slice(0,200)}`);
}

// 2) Chat libre
const nAntes = (await dockText()).length;
const hayComposer = await page.evaluate(()=>!!document.querySelector('.composer-input'));
console.log('hay composer:', hayComposer);
if (hayComposer){
  await page.locator('.composer-input').fill('no entiendo nada, ¿me explicas otra vez?');
  try { await page.locator('.composer-enviar').click({timeout:4000}); log.chatEnvio='click'; }
  catch(e){ log.chatEnvio='CLICK IMPOSIBLE: '+String(e).split('\n')[0].slice(0,120);
            await page.locator('.composer-input').press('Enter'); log.chatEnvio+=' -> Enter'; }
  console.log('  envio chat:', log.chatEnvio);
  await page.waitForTimeout(12000);
  const d = await dockText();
  log.chat = {nodosNuevos: d.length-nAntes, textoNuevo: d.slice(nAntes).map(x=>x.txt)};
  console.log('  chat -> nodos nuevos =', d.length-nAntes, JSON.stringify(log.chat.textoNuevo).slice(0,400));
}

log.final = {
  botonesVivosBody: await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body button:not([disabled])')).map(b=>b.textContent.trim())),
  hayPreguntaViva: await page.evaluate(()=>{const ps=document.querySelectorAll('.dock-body .pregunta'); const l=ps[ps.length-1]; return l? Array.from(l.querySelectorAll('button,input,textarea')).some(e=>!e.disabled) : null;}),
  frasesCierre: await page.evaluate(()=>document.body.innerText.includes('Eso es todo por ahora')),
  dockEstado: await page.evaluate(()=>window.__tutoria.dock?.actual),
};
console.log('FINAL:', JSON.stringify(log.final));
await page.screenshot({path: OUT.replace('.json','-final.png')});
fs.writeFileSync(OUT, JSON.stringify(log,null,1));
await browser.close();
