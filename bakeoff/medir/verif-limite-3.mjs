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
let nChat = 0;
page.on('request', r => { if (r.url().includes('/chat')) nChat++; });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const sid = await page.evaluate(`window.__tutoriaSesion && (window.__tutoriaSesion.id||window.__tutoriaSesion.session_id)`);
console.log('sessionId:', sid);
await page.locator('#ask').first().click();
await page.waitForTimeout(500);

const inp = page.locator('.composer-input');
async function estado(){
  return await page.evaluate(`(()=>{
    const c=document.querySelector('.composer');
    const i=document.querySelector('.composer-input');
    const b=document.querySelector('.composer-enviar');
    const r=document.querySelector('.composer-restantes');
    const cs=getComputedStyle(i);
    return {agotado:c.getAttribute('data-agotado'), restantes:r.textContent.trim(),
      inputDisabled:i.disabled, inputReadOnly:i.readOnly, btnDisabled:b.disabled,
      ariaDisabled:i.getAttribute('aria-disabled'), placeholder:i.placeholder,
      pe:cs.pointerEvents, op:cs.opacity, foco:document.activeElement===i,
      n:document.querySelectorAll('.dock-body > *').length};
  })()`);
}
// Espera a que llegue la respuesta del tutor: la ultima burbuja debe ser .tutor
async function esperarTutor(n){
  await page.waitForFunction(`(()=>{const a=[...document.querySelectorAll('.dock-body > *')];
    return a.length>=${n} && a[a.length-1].className.includes('tutor');})()`, null, {timeout:40000});
  await page.waitForTimeout(300);
}

console.log('\n--- 12 preguntas (con raton, normal) ---');
const preguntas=['por que sube la linea','que significa la pendiente','y si baja el precio','que es el ingreso',
 'como se calcula','de donde sale el 4','que pasa si gasto menos','explicame otra vez','no entiendo el eje',
 'que unidades son','y el cafe','ultima duda del limite'];
for (let i=0;i<12;i++){
  await inp.click({force:true});
  await inp.fill(preguntas[i]);
  await page.keyboard.press('Enter');
  await esperarTutor((i+1)*2);
  const e=await estado();
  console.log(`P${i+1}: restantes="${e.restantes}" agotado="${e.agotado}" inputDisabled=${e.inputDisabled} btnDisabled=${e.btnDisabled} pe=${e.pe} op=${e.op} foco=${e.foco}`);
}
console.log('\n=== ESTADO EXACTO TRAS 12 (limite agotado) ===');
console.log(JSON.stringify(await estado(),null,2));
console.log('peticiones /chat hasta ahora:', nChat);
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/A-tras12.png'});

// Prueba explicita: se puede pulsar con el raton?
console.log('\n--- ¿el raton puede pulsar el boton Preguntar? ---');
try { await page.locator('.composer-enviar').click({timeout:2500}); console.log('  RATON: click OK (no bloqueado)'); }
catch(e){ console.log('  RATON: BLOQUEADO ->', String(e.message).split('\n')[0].slice(0,110)); }

console.log('\n--- AHORA SOLO TECLADO, SIN TOCAR EL RATON ---');
for (const [k,txt] of [[13,'Entonces me quedo sin ayuda? necesito entender esto para el examen'],[14,'hola?'],[15,'porfa ayudame'],[16,'sigo aqui'],[17,'me respondes?']]){
  const antes=nChat;
  const eAntes=await estado();
  console.log(`  [antes de ${k}] foco dentro de la caja = ${eAntes.foco}`);
  await page.keyboard.type(txt);
  const v=await page.evaluate(`document.querySelector('.composer-input').value`);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3500);
  const e=await estado();
  const ult=await page.evaluate(`(()=>{const a=[...document.querySelectorAll('.dock-body > *')];return a.slice(-2).map(x=>x.className+' :: '+x.textContent.trim().slice(0,90));})()`);
  console.log(`INTENTO ${k}: texto entro en la caja=${JSON.stringify(v)} | peticiones /chat nuevas=${nChat-antes} | burbujas=${e.n} | restantes="${e.restantes}"`);
  ult.forEach(u=>console.log('        ', u));
}
console.log('\ntotal peticiones /chat:', nChat, '(limite del servidor MAX_TURNS=12)');
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/B-tras17.png'});
// eventos que el cliente registro
const ev = await page.evaluate(`fetch('/api/session/${sid}/events').then(r=>r.ok?r.json():'n/a').catch(e=>'err')`);
console.log('\nevents endpoint:', JSON.stringify(ev).slice(0,400));
await browser.close();
