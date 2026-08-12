import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const errs=[];
page.on('pageerror', e => {errs.push(String(e).slice(0,200)); console.log('  JS ERROR:', String(e).slice(0,200));});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('cargado. duracion=', await page.evaluate('window.__tutoria.media.duration()'));

// paso 2
await page.evaluate('window.__tutoria.media.seek(143); window.__tutoria.media.play()');

// esperar a que aparezca la pregunta
const t0=Date.now();
await page.waitForSelector('.q', {timeout:20000});
console.log('pregunta aparecio tras', ((Date.now()-t0)/1000).toFixed(2),'s de espera');
await page.waitForTimeout(600);

const snap = async (etiqueta) => {
  const s = await page.evaluate(() => {
    const q = document.querySelector('.q');
    const opts = [...document.querySelectorAll('.q-opciones button')].map(b=>({
      txt:b.textContent.trim().slice(0,60), disabled:b.disabled,
      aria:b.getAttribute('aria-disabled'), cls:b.className}));
    const dock = document.querySelector('.dock');
    const inputs = [...document.querySelectorAll('input,textarea,[contenteditable="true"]')].map(i=>({
      tag:i.tagName, cls:i.className, disabled:i.disabled, ph:i.placeholder||'', vis:!!(i.offsetParent)}));
    const btns = [...document.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>({
      t:b.textContent.trim().slice(0,40), cls:b.className.slice(0,40), disabled:b.disabled}));
    return {
      qPresent: !!q,
      enunciado: q ? (q.querySelector('.q-enunciado')?.textContent.trim().slice(0,140)) : null,
      qHTMLlen: q ? q.innerHTML.length : 0,
      opts,
      dockText: dock ? dock.innerText.trim().slice(0,900) : null,
      inputs, btns,
      t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
      dockActual: JSON.parse(JSON.stringify(window.__tutoria.dock.actual ?? null)),
    };
  });
  console.log('\n===== '+etiqueta+' =====');
  console.log(JSON.stringify(s,null,1));
  return s;
};

const antes = await snap('ANTES DE RESPONDER');
await page.screenshot({path:OUT+'/v1-antes.png'});

// paso 4: pulsar la opcion 2
const opciones = await page.$$('.q-opciones button');
console.log('\nnum opciones:', opciones.length);
const txt2 = await opciones[1].textContent();
console.log('pulsando opcion 2:', txt2.trim());
await opciones[1].click();
await page.waitForTimeout(1500);
const desp = await snap('INMEDIATAMENTE DESPUES (1.5s)');
await page.screenshot({path:OUT+'/v2-despues.png'});

await page.waitForTimeout(8000);
const t8 = await snap('TRAS 8 s MAS');
await page.screenshot({path:OUT+'/v3-8s.png'});

console.log('\nJS ERRORS:', errs);
fs.writeFileSync(OUT+'/v-cp1.json', JSON.stringify({antes,desp,t8,errs},null,1));
await browser.close();
