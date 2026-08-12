import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync(new URL('./key.json', import.meta.url), 'utf8'));
const MODE = process.argv[2] || 'wrong';
const OUT  = process.argv[3] || `probe/log2-${MODE}.json`;
const MAXIT = +(process.argv[4]||45);

const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const log = {mode:MODE, jsErrors:[], consoleErrors:[], net:[], steps:[]};
page.on('pageerror', e => { log.jsErrors.push(String(e).slice(0,400)); console.log('  JS ERROR:', String(e).slice(0,200)); });
page.on('console', m => { if(m.type()==='error') log.consoleErrors.push(m.text().slice(0,300)); });
page.on('response', async r => { const u=r.url(); if(u.includes('/api/')){ let b=null; try{b=(await r.text()).slice(0,900);}catch{} log.net.push({url:u.replace('http://localhost:57330',''),status:r.status(),body:b}); }});
page.on('request', r => { const u=r.url(); if(u.includes('/api/') && r.method()==='POST'){ log.net.push({url:'POST '+u.replace('http://localhost:57330',''), body:(r.postData()||'').slice(0,400)}); }});

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(()=>{ const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play(); });

const dockText = () => page.evaluate(()=> Array.from(document.querySelectorAll('.dock-body > *')).map(n=>({cls:n.className, txt:n.textContent.trim().slice(0,260)})));
const intercepts = () => page.evaluate(()=>{
  const t = document.querySelectorAll('.capa-interceptos text');
  return {x: t[0]?.textContent, y: t[1]?.textContent};
});
async function press(key, n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(120); }

let lastCount = 0;
for (let i=0;i<MAXIT;i++){
  let appeared = true;
  try { await page.waitForFunction((n)=>document.querySelectorAll('.dock-body .pregunta').length > n, lastCount, {timeout: 20000}); }
  catch { appeared = false; }
  if (!appeared){ log.steps.push({i, event:'NO_NEW_QUESTION_TIMEOUT', dock: await dockText()}); console.log('#'+i+' TIMEOUT sin nueva pregunta'); break; }
  lastCount = await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(300);
  const q = await page.evaluate(()=>{ const ps=document.querySelectorAll('.dock-body .pregunta'); const last=ps[ps.length-1];
    return {cls:last.querySelector('.q').className, enunciado:last.querySelector('.q-enunciado')?.textContent||'',
            opciones:Array.from(last.querySelectorAll('.q-opcion')).map(b=>b.textContent)}; });
  const lastNext = [...log.net].reverse().find(n=>n.url.endsWith('/next'));
  let qid=null, socr=null, assist=null;
  try{ const j=JSON.parse(lastNext.body); qid=j.question?.id; socr=j.socratica; assist=j.assist; }catch{}
  const modal = q.cls.includes('q-mcq')?'mcq': q.cls.includes('q-numeric')?'numeric': q.cls.includes('q-open')?'open': q.cls.includes('q-manip')?'manip':'?';
  const k = KEY[qid]||{};
  const step = {i, qid, modalidad:modal, enunciado:q.enunciado, opciones:q.opciones, socratica:socr, assist};

  if (modal==='mcq'){
    let idx=0;
    if(k.opciones){ const want = MODE==='right'; const f=k.opciones.findIndex(o=>o.correcta===want); idx=f>=0?f:0; }
    else idx = MODE==='right'?0:q.opciones.length-1;
    step.eligio=q.opciones[idx];
    await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(idx).click();
  } else if (modal==='numeric'){
    let val='999';
    if (MODE==='right' && k.respuesta){ const st=await page.evaluate(()=>window.__tutoria.estado());
      val = String(Number(new Function('m','p1','p2','return ('+k.respuesta.expr+')')(st.m,st.p1,st.p2)).toFixed(3)); }
    step.eligio=val;
    await page.locator('.dock-body .pregunta').last().locator('.q-input').fill(val);
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click();
  } else if (modal==='open'){
    const val = MODE==='right'
      ? 'El precio del cafe solo cambia el intercepto horizontal m/p1. El intercepto vertical m/p2 no depende de p1, asi que no se mueve: la recta pivota sobre el.'
      : 'no se, la linea desaparece porque el dinero se acaba';
    step.eligio=val;
    await page.locator('.dock-body .pregunta').last().locator('.q-textarea').fill(val);
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click();
  } else if (modal==='manip'){
    step.antes = await intercepts();
    const esPunto = /punto/i.test(q.enunciado) || await page.evaluate(()=>!!document.querySelector('.punto-manip'));
    if (esPunto){
      if (MODE==='right'){ await press('ArrowLeft',2); }   // dentro del conjunto
      else { await press('ArrowUp',60); await press('ArrowRight',20); } // fuera, no asequible
      step.eligio = MODE==='right' ? 'punto dentro (izq x2)' : 'punto muy fuera';
    } else {
      if (MODE==='right'){
        if (/ingreso sube a 150/i.test(q.enunciado)){ await press('ArrowUp',50); await press('ArrowRight',17); step.eligio='y-int→150, x-int→50'; }
        else if (/precio del caf/i.test(q.enunciado)){ await press('ArrowLeft',8); step.eligio='x-int→25 (p1=4)'; }
        else { await press('ArrowUp',10); step.eligio='ArrowUp x10 (sin regla)'; }
      } else { await press('ArrowDown',20); step.eligio='ArrowDown x20 (recta hacia adentro)'; }
    }
    step.despues = await intercepts();
    await page.locator('.dock-body .pregunta').last().locator('button.primario').click();
  } else { step.eligio='DESCONOCIDO'; log.steps.push(step); break; }

  await page.waitForTimeout(2000);
  const after = await dockText();
  step.dockAfter = after.slice(-3);
  step.estadoDock = await page.evaluate(()=>window.__tutoria.dock?.actual);
  const ans = [...log.net].reverse().find(n=>n.url.endsWith('/answer') && n.status);
  step.answerResp = ans?.body;
  log.steps.push(step);
  console.log(`#${i} ${qid} [${modal}] ${String(step.eligio).slice(0,40)} => ${(step.answerResp||'SIN POST').slice(0,150)} | dock: ${step.dockAfter.map(x=>x.txt.slice(0,60)).join(' /// ')}`);
  if (after.some(x=>/Eso es todo por ahora/.test(x.txt))) { console.log('>>> CIERRE detectado'); break; }
}
log.final = {dock: await dockText(), dockEstado: await page.evaluate(()=>window.__tutoria.dock?.actual),
  bodyDataset: await page.evaluate(()=>({...document.body.dataset})),
  acciones: await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-acciones button')).map(b=>b.textContent)),
  composer: await page.evaluate(()=>!!document.querySelector('.composer-input')),
  botonesVivos: await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body button:not([disabled])')).map(b=>b.textContent))};
await page.screenshot({path: OUT.replace('.json','.png')});
fs.writeFileSync(OUT, JSON.stringify(log,null,1));
console.log('FIN steps=',log.steps.length,'jsErr=',log.jsErrors.length);
await browser.close();
