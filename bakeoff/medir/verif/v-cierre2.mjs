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
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play();});
async function press(key,n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(90); }
let last=0,n=0;
for (let i=0;i<45;i++){
  try{ await page.waitForFunction(x=>document.querySelectorAll('.dock-body .pregunta').length>x, last, {timeout:20000}); }catch{ break; }
  last = await page.evaluate(()=>document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(250); n++;
  const lastNext=[...net].reverse().find(x=>x.u.endsWith('/next')); let qid=null; try{qid=JSON.parse(lastNext.b).question?.id;}catch{}
  const cls = await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q').className);
  const k=KEY[qid]||{};
  if (cls.includes('q-mcq')){ const f=(k.opciones||[]).findIndex(o=>o.correcta); await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(f<0?0:f).click(); }
  else if (cls.includes('q-numeric')){ const st=await page.evaluate(()=>window.__tutoria.estado());
    const v=String(Number(new Function('m','p1','p2','return ('+k.respuesta.expr+')')(st.m,st.p1,st.p2)).toFixed(3));
    await page.locator('.dock-body .pregunta').last().locator('.q-input').fill(v);
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click(); }
  else if (cls.includes('q-open')){ await page.locator('.dock-body .pregunta').last().locator('.q-textarea').fill('Renuncio a 3 litros de jugo por cada kilo de cafe extra.');
    await page.locator('.dock-body .pregunta').last().locator('button[type=submit]').click(); }
  else if (cls.includes('q-manip')){ const en=await page.evaluate(()=>document.querySelector('.dock-body .pregunta:last-child .q-enunciado').textContent);
    if(/punto/i.test(en)) await press('ArrowLeft',2);
    else if(/ingreso sube a 150/i.test(en)){ await press('ArrowUp',50); await press('ArrowRight',17);} else await press('ArrowLeft',8);
    await page.locator('.dock-body .pregunta').last().locator('button.primario').click(); }
  await page.waitForTimeout(1600);
  if (await page.evaluate(()=>document.querySelector('.dock-body').textContent.includes('Eso es todo por ahora'))){ console.log('>>> CIERRE tras', n, 'items'); break; }
}
await page.waitForTimeout(1000);

const snap = (tag)=>page.evaluate(t=>({tag:t,
  dock: window.__tutoria.dock?.actual, body: document.body.dataset.dock,
  op: getComputedStyle(document.querySelector('.escenario')).opacity,
  nMsg: document.querySelectorAll('.dock-body .msg').length,
  ultimo: document.querySelector('.dock-body .msg:last-child')?.innerText.slice(0,160),
  t:+window.__tutoria.media.currentTime().toFixed(1), paused: window.__tutoria.media.paused(),
}), tag);
console.log('BASE  ', JSON.stringify(await snap('base')));

// visibilidad real en pantalla de cada afordancia, tal como queda la pagina
console.log('VISIBILIDAD:', JSON.stringify(await page.evaluate(()=>{
  const vis=e=>{const r=e.getBoundingClientRect(); return r.top<innerHeight && r.bottom>0 && r.left<innerWidth && r.right>0;};
  const o={};
  document.querySelectorAll('.dock-acciones button').forEach(b=>o['acc:'+b.textContent.trim()]=vis(b));
  const c=document.querySelector('.composer-input'); if(c) o['composer']=vis(c);
  const p=document.querySelector('#play'); if(p) o['play('+p.textContent.trim()+')']=vis(p);
  o['_scrollY']=document.scrollingElement.scrollTop; o['_scrollH']=document.scrollingElement.scrollHeight;
  return o;
}),null,0));

// 1) boton "¿Por que?"
await page.locator('.dock-acciones button', {hasText:'¿Por qué?'}).first().click();
await page.waitForTimeout(6000);
console.log('TRAS ¿Por qué?', JSON.stringify(await snap('porque')));

// 2) composer libre
await page.locator('.composer-input').fill('¿Puedo repasar la pendiente otra vez?');
await page.locator('.composer-enviar').click();
await page.waitForTimeout(8000);
console.log('TRAS composer  ', JSON.stringify(await snap('composer')));

// 3) "Listo, sigamos"
await page.locator('.dock-acciones button', {hasText:'Listo, sigamos'}).first().click();
await page.waitForTimeout(1500);
console.log('TRAS Listo     ', JSON.stringify(await snap('listo')));

// 4) reproductor: rebobinar y darle a play
await page.evaluate(()=>{window.__tutoria.media.seek(40); window.__tutoria.media.play();});
await page.waitForTimeout(2500);
console.log('TRAS seek(40)+play', JSON.stringify(await snap('play')));
await page.evaluate(()=>document.scrollingElement.scrollTo(0,0)); await page.waitForTimeout(600);
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif/v2-tras-todo.png'});
console.log('grafico tras seek(40):', JSON.stringify(await page.evaluate(()=>window.__tutoria.estado())));
console.log('scrollH ahora:', await page.evaluate(()=>document.scrollingElement.scrollHeight));
await browser.close();
