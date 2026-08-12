// Verificacion independiente del fallo "ciclo de 3 items + parada silenciosa en 40".
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync('/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe/key.json','utf8'));
const OUT = process.argv[2] || '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/verif-ciclo.json';
const MAXIT = +(process.argv[3] || 45);

const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const log = {jsErrors:[], net:[], steps:[]};
page.on('pageerror', e => { log.jsErrors.push(String(e).slice(0,400)); console.log('  JS ERROR:', String(e).slice(0,200)); });
page.on('response', async r => { const u=r.url(); if(u.includes('/api/')){ let b=null; try{b=(await r.text()).slice(0,1200);}catch{} log.net.push({url:u.replace('http://localhost:57330',''),status:r.status(),body:b}); }});

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('duracion audio =', await page.evaluate(()=>window.__tutoria.media.duration()));
await page.evaluate(()=>{ const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play(); });

const dockText = () => page.evaluate(()=> Array.from(document.querySelectorAll('.dock-body > *')).map(n=>({cls:n.className, txt:n.textContent.trim().slice(0,300)})));
async function press(key, n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(100); }

let lastCount = 0;
let cierre = null;
for (let i=0;i<MAXIT;i++){
  let appeared = true;
  try { await page.waitForFunction((n)=>document.querySelectorAll('.dock-body .pregunta').length > n, lastCount, {timeout: 15000}); }
  catch { appeared = false; }
  if (!appeared){
    log.steps.push({i, event:'NO_APARECE_PREGUNTA_NUEVA', dock: (await dockText()).slice(-4)});
    console.log('#'+i+'  >>> TIMEOUT: no aparece pregunta nueva');
    break;
  }
  lastCount = await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(250);
  const q = await page.evaluate(()=>{ const ps=document.querySelectorAll('.dock-body .pregunta'); const last=ps[ps.length-1];
    return {cls:last.querySelector('.q').className, enunciado:last.querySelector('.q-enunciado')?.textContent||'',
            opciones:Array.from(last.querySelectorAll('.q-opcion')).map(b=>b.textContent)}; });
  const lastNext = [...log.net].reverse().find(n=>n.url.endsWith('/next'));
  let qid=null, socr=null, assist=null;
  try{ const j=JSON.parse(lastNext.body); qid=j.question?.id; socr=j.socratica; assist=j.assist; }catch{}
  const modal = q.cls.includes('q-mcq')?'mcq': q.cls.includes('q-numeric')?'numeric': q.cls.includes('q-open')?'open': q.cls.includes('q-manip')?'manip':'?';
  const k = KEY[qid]||{};
  const step = {i, qid, sub:k.sub||null, tier:k.tier??null, modalidad:modal, enunciado:q.enunciado, socratica:socr, assist};

  if (modal==='mcq'){
    let idx = 0;
    if (k.opciones){ const f = k.opciones.findIndex(o=>o.correcta===false); idx = f>=0?f:q.opciones.length-1; }
    else idx = q.opciones.length-1;
    step.eligio = q.opciones[idx];
    await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(idx).click();
  } else if (modal==='numeric'){
    step.eligio='999';
    await page.locator('.dock-body .pregunta').last().locator('.q-input').fill('999');
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click();
  } else if (modal==='open'){
    step.eligio='no se, la linea desaparece porque el dinero se acaba';
    await page.locator('.dock-body .pregunta').last().locator('.q-textarea').fill(step.eligio);
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click();
  } else if (modal==='manip'){
    await press('ArrowDown',20);
    step.eligio='ArrowDown x20 + Listo';
    await page.locator('.dock-body .pregunta').last().locator('button.primario').click();
  } else { step.eligio='MODALIDAD DESCONOCIDA'; log.steps.push(step); break; }

  await page.waitForTimeout(1800);
  const after = await dockText();
  step.dockAfter = after.slice(-3).map(x=>x.txt);
  const ans = [...log.net].reverse().find(n=>n.url.endsWith('/answer') && n.status);
  step.answerResp = ans?.body;
  try { step.correcta = JSON.parse(ans.body).correcta; } catch { step.correcta = 'n/a'; }
  log.steps.push(step);
  console.log(`#${i} ${qid} [${modal}/${k.sub||'?'}/t${k.tier??'?'}] correcta=${step.correcta} | socr=${String(socr).slice(0,55)} | dock: ${step.dockAfter.map(t=>t.slice(0,55)).join(' /// ')}`);
  if (after.some(x=>/Eso es todo por ahora/.test(x.txt))) { cierre='FRASE DE CIERRE'; console.log('>>> CIERRE detectado'); break; }
}

// Estado final: que le queda al alumno.
log.final = {
  cierre,
  dockUltimos: (await dockText()).slice(-5),
  dockEstado: await page.evaluate(()=>window.__tutoria.dock?.actual),
  botonesVivosEnBody: await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body button:not([disabled])')).map(b=>b.textContent.trim())),
  botonesTotalesEnBody: await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body button')).map(b=>({t:b.textContent.trim(), dis:b.disabled}))),
  accionesDock: await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-acciones button')).map(b=>({t:b.textContent.trim(), dis:b.disabled}))),
  composer: await page.evaluate(()=>!!document.querySelector('.composer-input')),
  bodyDataset: await page.evaluate(()=>({...document.body.dataset})),
};
await page.screenshot({path: OUT.replace('.json','-final.png'), fullPage:false});
fs.writeFileSync(OUT, JSON.stringify(log,null,1));
console.log('\nFIN. items contestados =', log.steps.filter(s=>s.qid).length, ' jsErr=', log.jsErrors.length);
console.log('cierre =', cierre);
console.log('botones vivos en dock-body =', JSON.stringify(log.final.botonesVivosEnBody));
console.log('acciones dock =', JSON.stringify(log.final.accionesDock));
await browser.close();
