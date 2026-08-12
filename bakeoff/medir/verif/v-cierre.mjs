import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const KEY = JSON.parse(fs.readFileSync('/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/probe/key.json','utf8'));
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log('  JS ERROR:', String(e).slice(0,200)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,900);}catch{} net.push({u:u.replace(/.*\/api\//,''),b});}});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});

// estado inicial del grafico, para comparar al final
const graf0 = await page.evaluate(()=>JSON.stringify(window.__tutoria.estado()));
console.log('GRAFICO t=0 :', graf0);

await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play();});

async function press(key,n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(90); }

// busca CUALQUIER indicio de progreso en toda la pagina
const buscaProgreso = ()=>page.evaluate(()=>{
  const out={};
  out.progressEls = document.querySelectorAll('progress,[role=progressbar],.progreso,.progress,[class*=progres]').length;
  const txt = document.body.innerText;
  out.patronesTexto = (txt.match(/\b\d+\s*(de|\/)\s*\d+\b/g)||[]).slice(0,6);
  out.dockHeader = document.querySelector('.dock-h')?.innerText || null;
  out.aria = Array.from(document.querySelectorAll('[aria-valuenow],[aria-label*=progres],[aria-label*=Progres]')).map(e=>e.getAttribute('aria-label')||e.tagName);
  return out;
});

let last=0; let n=0; let cierre=false;
for (let i=0;i<45;i++){
  try{ await page.waitForFunction(x=>document.querySelectorAll('.dock-body .pregunta').length>x, last, {timeout:20000}); }
  catch{ console.log('  (no llego otra pregunta en i=',i,')'); break; }
  last = await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(250); n++;
  const lastNext=[...net].reverse().find(x=>x.u.endsWith('/next')); let qid=null; try{qid=JSON.parse(lastNext.b).question?.id;}catch{}
  const prog = await buscaProgreso();
  console.log(`item ${n} (${qid})  progressEls=${prog.progressEls} patrones=${JSON.stringify(prog.patronesTexto)} dockH="${prog.dockHeader}" aria=${JSON.stringify(prog.aria)}`);
  const cls = await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q').className);
  const k=KEY[qid]||{};
  if (cls.includes('q-mcq')){ const f=(k.opciones||[]).findIndex(o=>o.correcta); await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(f<0?0:f).click(); }
  else if (cls.includes('q-numeric')){ const st=await page.evaluate(()=>window.__tutoria.estado());
    const v=String(Number(new Function('m','p1','p2','return ('+k.respuesta.expr+')')(st.m,st.p1,st.p2)).toFixed(3));
    await page.locator('.dock-body .pregunta').last().locator('.q-input').fill(v);
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click(); }
  else if (cls.includes('q-open')){ await page.locator('.dock-body .pregunta').last().locator('.q-textarea').fill('Porque el precio relativo mide cuanto de un bien hay que dejar para obtener otro.');
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click(); }
  else if (cls.includes('q-manip')){ const en=await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q-enunciado').textContent);
    if(/punto/i.test(en)) await press('ArrowLeft',2);
    else if(/ingreso sube a 150/i.test(en)){ await press('ArrowUp',50); await press('ArrowRight',17);} else await press('ArrowLeft',8);
    await page.locator('.dock-body .pregunta').last().locator('button.primario').click(); }
  await page.waitForTimeout(1600);
  if (await page.evaluate(()=>document.querySelector('.dock-body').textContent.includes('Eso es todo por ahora'))){ console.log('>>> CIERRE tras', n, 'items'); cierre=true; break; }
}

await page.waitForTimeout(1200);
const fin = await page.evaluate(()=>{
  const s=document.scrollingElement;
  const dockBody=document.querySelector('.dock-body');
  const msgs=Array.from(dockBody.querySelectorAll('.msg')).map(m=>m.className+' :: '+m.innerText.slice(0,120));
  const lienzo=document.querySelector('.lienzo'); const lr=lienzo?.getBoundingClientRect();
  return {
    dockEstado: window.__tutoria.dock?.actual,
    bodyDataDock: document.body.dataset.dock,
    escenarioOpacity: getComputedStyle(document.querySelector('.escenario')).opacity,
    pageScrollH: s.scrollHeight, vh: innerHeight, scrollY: s.scrollTop,
    lienzoRect: lr? {top:Math.round(lr.top), bottom:Math.round(lr.bottom), h:Math.round(lr.height)}:null,
    lienzoVisible: lr? (lr.top<innerHeight && lr.bottom>0): null,
    botonesVivosDock: Array.from(document.querySelectorAll('.dock button:not([disabled])')).map(b=>b.textContent.trim()).filter(Boolean),
    botonesVivosDockBody: Array.from(document.querySelectorAll('.dock-body button:not([disabled])')).map(b=>b.textContent.trim()),
    composerExiste: !!document.querySelector('.composer-input'),
    composerDisabled: document.querySelector('.composer-input')?.disabled ?? null,
    composerAgotado: document.querySelector('.composer')?.dataset.agotado ?? null,
    composerRestantes: document.querySelector('.composer-restantes')?.textContent ?? null,
    playExiste: !!document.querySelector('#play'),
    playDisabled: document.querySelector('#play')?.disabled ?? null,
    ultimos3msgs: msgs.slice(-3),
    grafico: window.__tutoria.estado(),
    t: +window.__tutoria.media.currentTime().toFixed(1),
    dur: +window.__tutoria.media.duration().toFixed(1),
    paused: window.__tutoria.media.paused(),
  };
});
console.log('=== ESTADO FINAL ===');
console.log(JSON.stringify(fin,null,1));
console.log('=== progreso final ===', JSON.stringify(await buscaProgreso()));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif/v-cierre-tal-cual.png'});
await page.evaluate(()=>document.scrollingElement.scrollTo(0,0)); await page.waitForTimeout(500);
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif/v-cierre-arriba.png'});
console.log('grafico tras subir scroll:', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())));
await page.evaluate(()=>document.scrollingElement.scrollTo(0,999999)); await page.waitForTimeout(500);
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif/v-cierre-fondo.png'});
fs.writeFileSync('/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif/net.json', JSON.stringify(net,null,1));
await browser.close();
