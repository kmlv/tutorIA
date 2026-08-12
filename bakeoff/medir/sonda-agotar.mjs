import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT = '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(() => window.__tutoria.media.pause());
await page.click('#ask'); await page.waitForTimeout(500);

const lee = () => page.evaluate(() => {
  const c = document.querySelector('.composer-restantes');
  const f = document.querySelector('.composer');
  const inp = document.querySelector('.composer-input');
  const btn = document.querySelector('.composer-enviar');
  const cs = inp ? getComputedStyle(inp) : null;
  const msgs = [...document.querySelectorAll('.dock .msg')];
  return {contador: c && c.textContent, agotado: f && f.dataset.agotado,
          inputDisabled: inp && inp.disabled, pointerEvents: cs && cs.pointerEvents,
          opacidad: cs && cs.opacity, placeholder: inp && inp.placeholder,
          btnTexto: btn && btn.textContent,
          ultimoTutor: msgs.filter(m=>m.className.includes('tutor')).slice(-1).map(m=>m.textContent.trim())[0]};
});
console.log('t0 (sin preguntar):', JSON.stringify(await lee()));

for (let i=1; i<=14; i++) {
  const prev = (await lee()).contador;
  // escribir directo: si está apagado con pointer-events, fill sigue funcionando -> util
  try { await page.fill('.composer-input', `pregunta numero ${i}, no entiendo`); }
  catch(e) { console.log(`#${i} no pude escribir:`, e.message.slice(0,90)); }
  try { await page.click('.composer-enviar', {timeout: 3000}); }
  catch(e) { console.log(`#${i} no pude pulsar Preguntar:`, e.message.split('\n')[0].slice(0,90)); break; }
  await page.waitForFunction(p => {
    const c = document.querySelector('.composer-restantes');
    return c && c.textContent !== p;
  }, prev, {timeout: 90000}).catch(()=>console.log(`#${i} contador no cambió`));
  await page.waitForTimeout(300);
  const s = await lee();
  console.log(`#${i} ->`, JSON.stringify({contador:s.contador, agotado:s.agotado, disabled:s.inputDisabled,
    pe:s.pointerEvents, op:s.opacidad, tutor:(s.ultimoTutor||'').slice(0,90)}));
  if (s.agotado === '1') {
    await page.screenshot({path: `${OUT}/agotado-es.png`, clip:{x:900,y:520,width:380,height:340}});
    console.log('ESTADO AGOTADO alcanzado en la pregunta', i);
    console.log('detalle completo:', JSON.stringify(s, null, 1));
    // ¿queda alguna acción? probar botones de intencion y teclado
    const acciones = await page.evaluate(() => {
      const bs = [...document.querySelectorAll('.dock-acciones button')];
      return bs.map(b=>({t:b.textContent.trim(), disabled:b.disabled, pe:getComputedStyle(b).pointerEvents}));
    });
    console.log('botones de intencion:', JSON.stringify(acciones));
    // ¿el Enter todavía manda?
    await page.evaluate(() => { const i=document.querySelector('.composer-input'); i.value='intento tras agotar'; });
    const enterRes = await page.evaluate(() => {
      const i=document.querySelector('.composer-input');
      i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
      return {valor:i.value, disabled:i.disabled};
    });
    await page.waitForTimeout(1500);
    console.log('tras Enter con caja apagada:', JSON.stringify(enterRes), 'contador ahora:', (await lee()).contador);
    break;
  }
}
await page.screenshot({path: `${OUT}/agotado-es-full.png`, fullPage:false});
await browser.close();
