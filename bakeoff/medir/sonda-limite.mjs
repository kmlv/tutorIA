import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const sid = await page.evaluate(() => window.__tutoriaSesion?.id ?? window.__tutoriaSesion?.session_id ?? null);
console.log('SESSION_ID:', sid);
fs.writeFileSync('/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/sid.txt', String(sid));

// pulsar "Preguntar"
await page.click('#ask');
await page.waitForTimeout(600);
console.log('composer visible:', await page.isVisible('.composer-input'));

async function preguntar(txt) {
  await page.fill('.composer-input', txt);
  await page.click('.composer-enviar');
  // esperar a que el boton deje de estar en "Pensando"
  await page.waitForFunction(() => {
    const b = document.querySelector('.composer-enviar');
    return b && !b.disabled;
  }, null, {timeout: 60000});
  await page.waitForTimeout(250);
  const cont = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.dock *')].map(n=>n.textContent.trim()).filter(Boolean);
    return nodes.slice(-3);
  });
  const contador = await page.evaluate(() => {
    const el = document.querySelector('.composer-restantes, .composer .contador, [class*=restant]');
    return el ? el.textContent.trim() : null;
  });
  const agotado = await page.evaluate(() => {
    const el = document.querySelector('[data-agotado]');
    return el ? el.dataset.agotado : null;
  });
  return {cont, contador, agotado};
}

for (let i=1; i<=12; i++) {
  const r = await preguntar(`Pregunta numero ${i}: no entiendo por que la recta baja.`);
  console.log(`T${i} contador=${JSON.stringify(r.contador)} agotado=${JSON.stringify(r.agotado)}`);
}

console.log('--- ahora las dos marcadas ---');
const a = await preguntar('MARCADOR_PERDIDO_UNO no entiendo la pendiente');
console.log('EXTRA1 dock-ultimo:', JSON.stringify(a.cont));
console.log('EXTRA1 contador=', a.contador, 'agotado=', a.agotado);
const b = await preguntar('MARCADOR_PERDIDO_DOS sigo sin entender');
console.log('EXTRA2 dock-ultimo:', JSON.stringify(b.cont));
console.log('EXTRA2 contador=', b.contador, 'agotado=', b.agotado);

await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/limite.png'});
await browser.close();
