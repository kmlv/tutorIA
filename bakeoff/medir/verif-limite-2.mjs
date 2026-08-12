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
const netlog = [];
page.on('request', r => { const u=r.url(); if (!/\.(js|ts|css|mp3|wav|png|svg|woff2?|json)(\?|$)/.test(u) && !u.includes('/@')) netlog.push({t:Date.now(), m:r.method(), u}); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.locator('#ask').first().click();
await page.waitForTimeout(600);

const inp = page.locator('.composer-input');
const btn = page.locator('.composer-enviar');

async function estado(){
  return await page.evaluate(`(()=>{
    const dock=document.querySelector('.dock');
    const i=document.querySelector('.composer-input');
    const b=document.querySelector('.composer-enviar');
    const r=document.querySelector('.composer-restantes');
    const burbujas=[...document.querySelectorAll('.dock-body > *')].map(e=>({cls:e.className, txt:(e.textContent||'').trim().slice(0,120)}));
    const cs = i? getComputedStyle(i) : null;
    return {
      dockData: dock && dock.getAttribute('data-estado'),
      agotado: dock && dock.getAttribute('data-agotado'),
      composerAgotado: document.querySelector('.composer') && document.querySelector('.composer').getAttribute('data-agotado'),
      inputDisabled: i? i.disabled : null,
      inputReadOnly: i? i.readOnly : null,
      btnDisabled: b? b.disabled : null,
      placeholder: i? i.placeholder : null,
      restantes: r? r.textContent.trim() : null,
      pointerEvents: cs? cs.pointerEvents : null,
      opacity: cs? cs.opacity : null,
      focoDentro: document.activeElement === i,
      focoTag: document.activeElement ? (document.activeElement.className||document.activeElement.tagName) : null,
      nBurbujas: burbujas.length,
      ultimas: burbujas.slice(-2)
    };
  })()`);
}

async function preguntar(txt, i){
  const antes = (await page.locator('.dock-body > *').count());
  await inp.click({force:true}).catch(()=>{});
  await inp.fill(txt);
  await page.keyboard.press('Enter');
  // esperar a que crezcan las burbujas o 12s
  try {
    await page.waitForFunction(`document.querySelectorAll('.dock-body > *').length > ${antes+0}`, null, {timeout:15000});
  } catch(e){ console.log('   (sin crecimiento de burbujas)'); }
  await page.waitForTimeout(1500);
  const e = await estado();
  console.log(`P${i} "${txt.slice(0,30)}" -> restantes="${e.restantes}" burbujas=${e.nBurbujas} agotado=${e.agotado} inputDisabled=${e.inputDisabled} btnDisabled=${e.btnDisabled}`);
  return e;
}

const preguntas = ['por que sube la linea','que significa la pendiente','y si baja el precio','que es el ingreso',
 'como se calcula','de donde sale el 4','que pasa si gasto menos','explicame otra vez','no entiendo el eje',
 'que unidades son','y el cafe','ultima duda del limite'];
for (let i=0;i<preguntas.length;i++){ await preguntar(preguntas[i], i+1); }

console.log('\n===== ESTADO TRAS 12 PREGUNTAS =====');
const e12 = await estado();
console.log(JSON.stringify(e12, null, 2));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/tras12.png'});

console.log('\n===== 13ª: SIN TOCAR EL RATON, ESCRIBIR CON TECLADO =====');
const nAntes = netlog.length;
// NO click. Solo teclado sobre el elemento enfocado.
console.log('foco actual:', JSON.stringify((await estado()).focoTag));
await page.keyboard.type('Entonces me quedo sin ayuda? necesito entender esto para el examen');
const valTecleado = await page.evaluate(`document.querySelector('.composer-input').value`);
console.log('valor en la caja tras teclear (sin raton):', JSON.stringify(valTecleado));
await page.keyboard.press('Enter');
await page.waitForTimeout(4000);
const e13 = await estado();
console.log('tras 13ª:', JSON.stringify(e13, null, 2));
console.log('peticiones nuevas:', JSON.stringify(netlog.slice(nAntes), null, 2));

console.log('\n===== 14ª =====');
const nAntes2 = netlog.length;
await page.keyboard.type('hola?');
console.log('valor caja:', JSON.stringify(await page.evaluate(`document.querySelector('.composer-input').value`)));
await page.keyboard.press('Enter');
await page.waitForTimeout(4000);
const e14 = await estado();
console.log('tras 14ª:', JSON.stringify(e14, null, 2));
console.log('peticiones nuevas:', JSON.stringify(netlog.slice(nAntes2), null, 2));

console.log('\n===== 15ª =====');
const nAntes3 = netlog.length;
await page.keyboard.type('porfa');
await page.keyboard.press('Enter');
await page.waitForTimeout(4000);
const e15 = await estado();
console.log('tras 15ª:', JSON.stringify(e15, null, 2));
console.log('peticiones nuevas:', JSON.stringify(netlog.slice(nAntes3), null, 2));

console.log('\n===== TODAS LAS BURBUJAS FINALES =====');
const todas = await page.evaluate(`[...document.querySelectorAll('.dock-body > *')].map(e=>e.className+' :: '+(e.textContent||'').trim().slice(0,160))`);
todas.forEach((t,i)=>console.log(i, t));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/tras15.png', fullPage:false});
await browser.close();
