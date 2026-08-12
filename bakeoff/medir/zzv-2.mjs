import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('console', m => { if(m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });
await page.addInitScript(()=>{
  window.__log=[];
  const of=window.fetch;
  window.fetch=async(...a)=>{const url=typeof a[0]==='string'?a[0]:a[0].url;const req=a[1]&&a[1].body?String(a[1].body):null;
    const r=await of(...a); if(/\/(next|answer)/.test(url)){const c=r.clone();c.text().then(t=>window.__log.push({url:url.replace(/^.*\/api/,''),req,resp:t})).catch(()=>{});} return r;};
});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.practice.start(); 1');

const q = () => page.evaluate(() => {
  const q = document.querySelector('.dock .pregunta:last-child .q');
  return q ? {cls:q.className, enun:(q.querySelector('.q-enunciado')||{}).textContent,
    nota:(q.querySelector('.q-nota')||{}).textContent||null,
    opts:[...q.querySelectorAll('.q-opciones button')].map(b=>b.textContent)} : null;
});
let s=null;
for (let i=0;i<25;i++){
  await page.waitForTimeout(500);
  s = await q();
  if (!s) continue;
  console.log('ITEM', i, s.cls, '|', s.enun);
  if (s.cls.includes('q-manip') && /extremos de la recta/.test(s.nota||'')) { console.log('>>> MANIP DE RECTA'); break; }
  if (s.cls.includes('q-manip')) { // punto: contestar arrastrando poco y Listo
    console.log('  (manip de punto, lo resuelvo para seguir)');
    const box = await page.locator('.lienzo svg').boundingBox();
    const pt = await page.locator('.capa-manip .punto-manip');
    const b = await pt.boundingBox();
    await page.mouse.move(b.x+b.width/2, b.y+b.height/2); await page.mouse.down();
    await page.mouse.move(b.x+b.width/2-60, b.y+b.height/2+60, {steps:10}); await page.mouse.up();
    await page.click('.dock .pregunta:last-child .q button.primario');
    continue;
  }
  if (s.cls.includes('q-mcq')) await page.click('.dock .pregunta:last-child .q-opciones button');
  else if (s.cls.includes('q-numeric')) { await page.fill('.dock .pregunta:last-child .q-input','33.3'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill('.dock .pregunta:last-child .q-textarea','la linea es la frontera del conjunto'); await page.click('.dock .pregunta:last-child button[type=submit]'); }
}
console.log('FINAL ITEM:', JSON.stringify(s));
await page.screenshot({path:OUT+'/v2-llegada.png'});
fs.writeFileSync(OUT+'/v2-log.json', JSON.stringify(await page.evaluate('window.__log'),null,1));
await browser.close();
