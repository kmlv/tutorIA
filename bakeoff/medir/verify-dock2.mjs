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
const medir = async (et) => {
  const m = await page.evaluate(() => {
    const vh=innerHeight, vw=innerWidth;
    const frac=(s)=>{const el=document.querySelector(s); if(!el) return null;
      const r=el.getBoundingClientRect(); if(!r.width||!r.height) return {pct:0};
      const v=Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0))*Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0));
      return {pct:Math.round(100*v/(r.width*r.height)), top:Math.round(r.top)};};
    return {scrollY:Math.round(scrollY), docH:document.documentElement.scrollHeight,
      lienzo:frac('.lienzo'), play:frac('#play'), bands:frac('.bands'),
      msgs:document.querySelectorAll('.dock .msg').length};
  });
  console.log(et, JSON.stringify(m)); return m;
};
// escenario 2: sin checkpoint, boton Preguntar
const emp = page.locator('button', {hasText:'Empezar'}).first();
if (await emp.count()) await emp.click();
await page.waitForTimeout(600);
const ask = await page.$('#ask');
console.log('boton #ask texto:', ask ? (await ask.textContent()).trim() : 'NO EXISTE');
await page.click('#ask');
await page.waitForTimeout(800);
await medir('tras Preguntar (0 preg):');
for (let i=1;i<=5;i++){
  const antes = await page.evaluate(()=>document.querySelectorAll('.dock .msg').length);
  await page.click('.composer-input');
  await page.fill('.composer-input','explícame con detalle qué significa que la línea se desplace y por qué importa el ingreso aquí');
  await page.press('.composer-input','Enter');
  await page.waitForFunction((a)=>document.querySelectorAll('.dock .msg').length>=a+2, antes, {timeout:60000}).catch(()=>console.log('  timeout',i));
  await page.waitForTimeout(2000);
  await medir(`${i} pregunta(s):`);
}
await page.screenshot({path: OUT+'/v-narracion-5preg.png'});
// ventana de portatil tipico 1280x720 -> cuantas preguntas hasta perder el grafico
await browser.close();
