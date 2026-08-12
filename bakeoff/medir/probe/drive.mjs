import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync(new URL('./key.json', import.meta.url), 'utf8'));
const MODE = process.argv[2] || 'wrong';   // wrong | right
const OUT  = process.argv[3] || `probe/log-${MODE}.json`;

const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const log = {mode:MODE, jsErrors:[], consoleErrors:[], net:[], steps:[]};
page.on('pageerror', e => { log.jsErrors.push(String(e).slice(0,400)); console.log('  JS ERROR:', String(e).slice(0,200)); });
page.on('console', m => { if(m.type()==='error') log.consoleErrors.push(m.text().slice(0,300)); });
page.on('response', async r => {
  const u = r.url();
  if (u.includes('/api/')) {
    let body=null; try{ body = (await r.text()).slice(0,900);}catch{}
    log.net.push({url:u.replace('http://localhost:57330',''), status:r.status(), body});
  }
});

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// hook: track which question id is active via the practice events if exposed; else DOM
await page.evaluate(()=>{ const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play(); });

const dockText = () => page.evaluate(()=> Array.from(document.querySelectorAll('.dock-body > *')).map(n=>({cls:n.className, txt:n.textContent.trim().slice(0,300)})));

let lastCount = 0;
for (let i=0;i<45;i++){
  // wait for a new .pregunta to appear
  let appeared = true;
  try {
    await page.waitForFunction((n)=>document.querySelectorAll('.dock-body .pregunta').length > n, lastCount, {timeout: 25000});
  } catch { appeared = false; }
  if (!appeared) {
    log.steps.push({i, event:'NO_NEW_QUESTION_TIMEOUT', dock: await dockText()});
    break;
  }
  lastCount = await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(250);
  const q = await page.evaluate(()=>{
    const ps = document.querySelectorAll('.dock-body .pregunta');
    const last = ps[ps.length-1];
    const el = last.querySelector('.q');
    return {cls: el.className, enunciado: last.querySelector('.q-enunciado')?.textContent||'',
            opciones: Array.from(last.querySelectorAll('.q-opcion')).map(b=>b.textContent),
            html: last.innerHTML.slice(0,1200)};
  });
  // identify question id by matching enunciado to key? we get it from network /next
  const lastNext = [...log.net].reverse().find(n=>n.url.endsWith('/next'));
  let qid=null; try{ qid = JSON.parse(lastNext.body).question?.id; }catch{}
  const before = await dockText();
  const step = {i, qid, ...q, dockBefore: before.slice(-6)};

  const modal = q.cls.includes('q-mcq') ? 'mcq' : q.cls.includes('q-numeric') ? 'numeric'
    : q.cls.includes('q-open') ? 'open' : q.cls.includes('q-manip') ? 'manip' : 'unknown';
  step.modalidad = modal;
  const k = KEY[qid] || {};

  if (modal === 'mcq') {
    let idx = 0;
    if (k.opciones) {
      const wantCorrect = MODE==='right';
      const found = k.opciones.findIndex(o=>o.correcta===wantCorrect);
      idx = found >= 0 ? found : 0;
    } else { idx = MODE==='right' ? 0 : q.opciones.length-1; }
    step.eligio = q.opciones[idx];
    await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(idx).click();
  } else if (modal === 'numeric') {
    let val = '999';
    if (MODE==='right' && k.respuesta) {
      const st = await page.evaluate(()=>window.__tutoria.estado());
      const {m,p1,p2} = st;
      // eslint-disable-next-line no-new-func
      val = String(Number(new Function('m','p1','p2','return ('+k.respuesta.expr+')')(m,p1,p2)).toFixed(3));
    }
    step.eligio = val; step.estadoGrafico = await page.evaluate(()=>window.__tutoria.estado());
    await page.locator('.dock-body .pregunta').last().locator('.q-input').fill(val);
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click();
  } else if (modal === 'open') {
    const val = MODE==='right'
      ? 'Porque el precio del bien 1 solo afecta al intercepto horizontal m/p1; el intercepto vertical m/p2 no depende de p1, asi que no se mueve y la recta pivota.'
      : 'no se, creo que la linea desaparece porque el dinero se acaba';
    step.eligio = val;
    await page.locator('.dock-body .pregunta').last().locator('.q-textarea').fill(val);
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click();
  } else if (modal === 'manip') {
    step.eligio = 'CLICK Listo sin arrastrar';
    await page.locator('.dock-body .pregunta').last().locator('button.primario').click();
  } else {
    step.eligio = 'DESCONOCIDO'; log.steps.push(step); break;
  }
  await page.waitForTimeout(1800);
  step.dockAfter = (await dockText()).slice(-5);
  step.estadoDock = await page.evaluate(()=>window.__tutoria.dock?.actual);
  log.steps.push(step);
  console.log(`#${i} ${qid} [${modal}] -> ${String(step.eligio).slice(0,60)} || ${step.dockAfter.map(x=>x.txt.slice(0,70)).join(' /// ')}`);
  const fin = step.dockAfter.some(x=>/Eso es todo por ahora/.test(x.txt));
  if (fin) { log.steps.push({i:'FIN', dock: await dockText()}); break; }
}
log.final = {dock: await dockText(), dockEstado: await page.evaluate(()=>window.__tutoria.dock?.actual),
  bodyDataset: await page.evaluate(()=>({...document.body.dataset})),
  hayQ: await page.evaluate(()=>!!document.querySelector('.dock-body .pregunta:last-child .q button:not([disabled])')),
  acciones: await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-acciones button')).map(b=>b.textContent))};
await page.screenshot({path: OUT.replace('.json','.png'), fullPage:false});
fs.writeFileSync(OUT, JSON.stringify(log,null,1));
console.log('FIN. steps=',log.steps.length,'jsErrors=',log.jsErrors.length);
await browser.close();
