import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const U='http://localhost:57330';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const fallos=[]; const ok=(c,m)=>{console.log(`  ${c?'✓':'✗'} ${m}`); if(!c) fallos.push(m);};

// 1. ?lang inválido ya no deja la página en blanco
{ const p=await (await browser.newContext()).newPage();
  await p.goto(`${U}/?lang=fr`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(2500);
  const txt=await p.evaluate('document.body.innerText.trim().length');
  const idioma=await p.evaluate('document.documentElement.lang');
  ok(txt>50, `?lang=fr pinta la lección (${txt} caracteres, html lang="${idioma}")`);
  await p.context().close(); }

// 2. ?variant en minúscula no rompe
{ const p=await (await browser.newContext()).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(`${U}/?lang=es&variant=b`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(3000);
  const vivo=await p.evaluate('!!window.__tutoria');
  ok(vivo && errs.length===0, `?variant=b arranca (errores JS: ${errs.length})`);
  await p.context().close(); }

// 3. ?t= mueve TAMBIÉN el audio
{ const p=await (await browser.newContext()).newPage();
  await p.goto(`${U}/?lang=es&t=110`,{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await p.waitForTimeout(1500);
  const t=await p.evaluate('+window.__tutoria.media.currentTime().toFixed(0)');
  ok(Math.abs(t-110)<3, `?t=110 deja el reloj en ${t}s, no en 0`);
  await p.context().close(); }

// 4. Los chips de ayuda ahora preguntan de verdad
{ const ctx=await browser.newContext(); const p=await ctx.newPage();
  let cuerpo=null;
  await p.route('**/chat', async r=>{ cuerpo=JSON.parse(r.request().postData()||'{}'); await r.abort(); });
  await p.goto(`${U}/?lang=es`,{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria',null,{timeout:30000});
  await p.evaluate('document.getElementById("ask").click()');
  await p.waitForTimeout(600);
  await p.evaluate(`[...document.querySelectorAll('.intencion')].find(b=>/No entiendo/.test(b.textContent))?.click()`);
  await p.waitForTimeout(1500);
  ok(cuerpo!==null && /entiendo/i.test(cuerpo?.pregunta||''), `el chip «No entiendo» manda al tutor: ${JSON.stringify(cuerpo?.pregunta||null)}`);
  await ctx.close(); }

// 5. Manip: «Listo» sin arrastrar ahora SÍ llega al servidor
{ const ctx=await browser.newContext(); const p=await ctx.newPage();
  const answers=[];
  p.on('request',r=>{ if(/\/answer$/.test(r.url())) answers.push(1); });
  await p.goto(`${U}/?lang=es`,{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await p.evaluate('(()=>{const m=window.__tutoria.media; m.seek(m.duration()-1); return m.play();})()');
  await p.waitForTimeout(9000);
  // avanzar hasta un ítem de manipulación
  for (let i=0;i<4;i++){
    const esManip=await p.evaluate(`!!document.querySelector('.q-manip')`);
    if(esManip){ await p.evaluate(`document.querySelector('.q-manip button.primario')?.click()`); await p.waitForTimeout(2500); break; }
    await p.evaluate(`document.querySelector('.q-opciones button, .q button.primario')?.click()`);
    await p.waitForTimeout(2500);
  }
  ok(answers.length>0, `«Listo» sin arrastrar llega al servidor (${answers.length} POST /answer)`);
  await ctx.close(); }

await browser.close();
console.log(`\n  ${fallos.length} fallo(s)`);
process.exit(fallos.length?1:0);
