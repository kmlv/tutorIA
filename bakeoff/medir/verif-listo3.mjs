import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT = '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
let posts=0, nexts=0, capped=null, answered=0, finished=null;
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('request', r => { const u=r.url(); const b=r.postData()||'';
  if (r.method()==='POST' && u.includes('/answer')) posts++;
  if (u.includes('/next')) nexts++;
  if (r.method()==='POST' && u.includes('/events')) {
    if (b.includes('practice.answered')) answered++;
    if (b.includes('practice.capped')) capped=b;
    if (b.includes('practice.finished')) finished=b; }
});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => { window.__tutoria.practice.start(); return 1; });
await page.waitForSelector('.q-opciones button', {timeout:15000});
await page.waitForTimeout(400);
await (await page.$$('.q-opciones button'))[0].click();
await page.waitForSelector('.q-manip', {timeout:15000});
await page.waitForTimeout(400);

let pulsaciones=0;
for (let i=0;i<50;i++){
  // esperar a que aparezca un boton habilitado (o rendirse)
  let ok=true;
  try { await page.waitForFunction(
    () => Array.from(document.querySelectorAll('.q-manip button.primario')).some(b=>!b.disabled),
    null, {timeout:4000}); } catch(e){ ok=false; }
  if(!ok){ console.log('  tras',pulsaciones,'pulsaciones: NO aparece ningun Listo habilitado en 4s -> fin'); break; }
  await page.evaluate(() => { const bs=Array.from(document.querySelectorAll('.q-manip button.primario')).filter(b=>!b.disabled); bs[bs.length-1].click(); });
  pulsaciones++;
  await page.waitForTimeout(120);
}
await page.waitForTimeout(3000);
const st = await page.evaluate(() => ({
  cards: document.querySelectorAll('.q-manip').length,
  habilitados: Array.from(document.querySelectorAll('.q-manip button.primario')).filter(b=>!b.disabled).length,
  msgs: Array.from(document.querySelectorAll('.dock .msg')).map(n=>n.textContent.trim()),
  active: window.__tutoria.practice.active,
  dockEstado: window.__tutoria.dock.actual,
  alto: document.querySelector('.dock').scrollHeight,
  composerHabilitado: !document.querySelector('.composer-input')?.disabled,
}));
console.log('\n=== FINAL (tope) ===');
console.log('  pulsaciones de Listo    :', pulsaciones);
console.log('  tarjetas .q-manip       :', st.cards);
console.log('  botones Listo habilitados:', st.habilitados);
console.log('  POST /answer TOTAL      :', posts);
console.log('  GET /next TOTAL         :', nexts);
console.log('  practice.answered evs   :', answered);
console.log('  practice.capped ev      :', capped);
console.log('  practice.finished ev    :', finished);
console.log('  practice.active         :', st.active);
console.log('  dock estado             :', st.dockEstado);
console.log('  dock scrollHeight       :', st.alto);
console.log('  composer utilizable     :', st.composerHabilitado);
console.log('  MENSAJES DEL TUTOR      :', JSON.stringify(st.msgs));
await page.screenshot({path: OUT+'/tope-final.png'});
await browser.close();
