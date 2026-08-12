import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT = '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
let posts=0, nexts=0, evCapped=null, evAnswered=0;
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('request', r => { const u=r.url();
  if (r.method()==='POST' && u.includes('/answer')) posts++;
  if (u.includes('/next')) nexts++;
  if (r.method()==='POST' && u.includes('/events')) { const b=r.postData()||'';
    if (b.includes('practice.answered')) evAnswered++;
    if (b.includes('practice.capped')) evCapped=b;
    if (b.includes('practice.finished')) console.log('  EV finished:', b); }
});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => { window.__tutoria.practice.start(); return 1; });
await page.waitForSelector('.q-opciones button', {timeout:15000});
await page.waitForTimeout(500);
await (await page.$$('.q-opciones button'))[0].click();
await page.waitForSelector('.q-manip', {timeout:15000});
await page.waitForTimeout(500);
console.log('manip montado. POSTs /answer hasta ahora =', posts, ' /next =', nexts);

// pulsar el ULTIMO "Listo" habilitado, en bucle
for (let i=0;i<45;i++){
  const btn = await page.evaluateHandle(() => {
    const bs = Array.from(document.querySelectorAll('.q-manip button.primario')).filter(b=>!b.disabled);
    return bs[bs.length-1] || null;
  });
  const el = btn.asElement();
  if (!el) { console.log('  iteracion',i,': NO queda boton Listo habilitado -> parada'); break; }
  await el.click();
  await page.waitForTimeout(230);
}
await page.waitForTimeout(2500);

const st = await page.evaluate(() => ({
  manipCards: document.querySelectorAll('.q-manip').length,
  botonesHabilitados: Array.from(document.querySelectorAll('.q-manip button.primario')).filter(b=>!b.disabled).length,
  botonesTotal: document.querySelectorAll('.q-manip button.primario').length,
  mensajesTutor: Array.from(document.querySelectorAll('.dock .msg')).map(n=>n.textContent.trim()),
  practiceActive: window.__tutoria.practice ? window.__tutoria.practice.active : 'n/a',
  dockEstado: window.__tutoria.dock.actual,
  alturaDock: document.querySelector('.dock').scrollHeight,
}));
console.log('\n=== ESTADO FINAL ===');
console.log('  tarjetas .q-manip apiladas :', st.manipCards);
console.log('  botones Listo total/habilitados:', st.botonesTotal, '/', st.botonesHabilitados);
console.log('  POST /answer TOTAL         :', posts);
console.log('  GET /next TOTAL            :', nexts);
console.log('  eventos practice.answered  :', evAnswered);
console.log('  evento practice.capped     :', evCapped);
console.log('  practice.active            :', st.practiceActive);
console.log('  dock estado                :', st.dockEstado);
console.log('  scrollHeight del dock (px) :', st.alturaDock);
console.log('  mensajes del tutor         :', JSON.stringify(st.mensajesTutor));
await page.screenshot({path: OUT+'/final-tope.png', fullPage:false});
await browser.close();
