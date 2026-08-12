import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT = '/Users/klopezva/GithubRepos/tutorIA/scratchpad/sondas-verify';
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// medidas: fraccion visible dentro del viewport
const medir = async (etiqueta) => {
  const m = await page.evaluate(() => {
    const vh = window.innerHeight, vw = window.innerWidth;
    const frac = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return {pct:0, top:Math.round(r.top), h:0, note:'zero-size'};
      const vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) *
                  Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
      return {pct: Math.round(100*vis/(r.width*r.height)), top: Math.round(r.top), h: Math.round(r.height)};
    };
    const dock = document.querySelector('.dock');
    const body = document.querySelector('.dock-body');
    return {
      scrollY: Math.round(window.scrollY),
      docH: document.documentElement.scrollHeight,
      vh,
      lienzo: frac('.lienzo'),
      escenario: frac('.escenario'),
      opciones: frac('.q-opciones'),
      q: frac('.q'),
      play: frac('#play'),
      bands: frac('.bands'),
      composer: frac('.composer-input'),
      dockH: dock ? Math.round(dock.getBoundingClientRect().height) : null,
      dockMaxH: dock ? getComputedStyle(dock).maxHeight : null,
      dockBodyClient: body ? body.clientHeight : null,
      dockBodyScroll: body ? body.scrollHeight : null,
      dockBodyOverflowY: body ? getComputedStyle(body).overflowY : null,
      msgs: document.querySelectorAll('.dock-body .msg, .dock .msg').length,
    };
  });
  console.log(etiqueta, JSON.stringify(m));
  return m;
};

// 1. Empezar
const empezar = page.locator('button', {hasText:'Empezar'}).first();
if (await empezar.count()) { await empezar.click(); console.log('clic Empezar'); }
else { console.log('NO hay boton Empezar; probando #play'); await page.click('#play').catch(()=>{}); }
await page.waitForTimeout(800);
await medir('t0 tras empezar:');

// 2. Saltar a justo antes del checkpoint y dejar correr
await page.evaluate(() => window.__tutoria.media.seek(142.0));
await page.evaluate(() => window.__tutoria.media.play());
console.log('reproduciendo hacia cp1...');
await page.waitForFunction(() => !!document.querySelector('.q'), null, {timeout:30000}).catch(e=>console.log('  no aparecio .q:', e.message.slice(0,80)));
await page.waitForTimeout(1200);
const info = await page.evaluate(() => ({
  t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
  enun: document.querySelector('.q-enunciado')?.textContent?.trim().slice(0,120),
  nopts: document.querySelectorAll('.q-opciones button').length,
}));
console.log('checkpoint:', JSON.stringify(info));
await medir('0 preguntas:');
await page.screenshot({path: OUT+'/v0-cp-abierto.png'});

// 3. Tres preguntas
const preguntas = [
  'explícame con detalle qué significa que la línea se desplace y por qué importa el ingreso aquí',
  'explícame con detalle qué significa que la línea se desplace y por qué importa el ingreso aquí',
  'explícame con detalle qué significa que la línea se desplace y por qué importa el ingreso aquí',
];
for (let i=0;i<preguntas.length;i++){
  const antes = await page.evaluate(()=>document.querySelectorAll('.dock .msg').length);
  await page.click('.composer-input');
  await page.fill('.composer-input', preguntas[i]);
  await page.press('.composer-input', 'Enter');
  // esperar respuesta: que crezcan los mensajes en >=2 y no quede "pensando"
  await page.waitForFunction((a)=>document.querySelectorAll('.dock .msg').length >= a+2, antes, {timeout:60000}).catch(e=>console.log('  timeout esperando respuesta', i+1));
  await page.waitForTimeout(2500);
  const m = await medir(`${i+1} pregunta(s):`);
  await page.screenshot({path: OUT+`/v${i+1}-tras-preg.png`});
}

// 4. Ultimo texto del tutor
const ultimo = await page.evaluate(()=>{
  const ms=[...document.querySelectorAll('.dock .msg')];
  return ms.slice(-2).map(m=>m.className+' :: '+m.textContent.trim().slice(0,180));
});
console.log('ultimos mensajes:', JSON.stringify(ultimo,null,1));

// 5. Prueba de recuperacion: subir con rueda y volver a hacer clic en el composer
await page.mouse.move(300, 400);
await page.mouse.wheel(0, -5000);
await page.waitForTimeout(600);
await medir('tras rueda arriba:');
await page.click('.composer-input');
await page.waitForTimeout(600);
await medir('tras clic en composer:');
await page.type('.composer-input', 'hola');
await page.waitForTimeout(600);
await medir('tras escribir:');
await page.screenshot({path: OUT+'/v-recuperacion.png'});

await browser.close();
