import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const net=[]; page.on('response', async r=>{const u=r.url(); if(u.includes('/api/')){let b=null;try{b=(await r.text()).slice(0,900);}catch{} net.push({u:u.split('/').pop(),s:r.status(),b});}});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(()=>{const m=window.__tutoria.media; m.seek(m.duration()-1.2); m.play();});

const snap = async (tag)=>{
  const s = await page.evaluate(()=>({
    estado: window.__tutoria.estado(),
    bands: document.querySelector('.bands')?.innerText.replace(/\n+/g,' | ') || null,
    aria: document.querySelector('.lienzo svg')?.getAttribute('aria-label'),
    interceptos: Array.from(document.querySelectorAll('.capa-interceptos text')).map(t=>t.textContent),
    enunciado: document.querySelector('.dock-body .pregunta:last-child .q-enunciado')?.innerText,
  }));
  console.log('--- '+tag+' ---');
  console.log(' enunciado:', s.enunciado);
  console.log(' estado grafico: m='+s.estado.m+' p1='+s.estado.p1+' p2='+s.estado.p2);
  console.log(' bands:', s.bands);
  console.log(' aria :', s.aria);
  console.log(' interceptos dibujados:', JSON.stringify(s.interceptos));
  return s;
};

await page.waitForSelector('.dock-body .pregunta .q-opcion');
await page.locator('.dock-body .pregunta').last().locator('.q-opcion').nth(0).click();
await page.waitForFunction(()=>document.querySelector('.dock-body .pregunta:last-child .q-manip'),null,{timeout:20000});
await page.waitForTimeout(700);
await snap('EN LA PREGUNTA MANIP, ANTES DE TOCAR NADA');

// ¿que controles hay?
const controles = await page.evaluate(()=>({
  manipHTML: document.querySelector('.dock-body .pregunta:last-child .q-manip')?.innerText,
  inputs: Array.from(document.querySelectorAll('.dock-body .pregunta:last-child input, .dock-body .pregunta:last-child select, .dock-body .pregunta:last-child button')).map(e=>e.tagName+':'+(e.innerText||e.type||'')),
  tiradores: document.querySelectorAll('.capa-manip circle.tirador').length,
  hitTargets: document.querySelectorAll('.capa-manip circle[fill=transparent]').length,
  sliderRole: !!document.querySelector('.capa-manip rect[role=slider]'),
}));
console.log('CONTROLES DISPONIBLES:', JSON.stringify(controles,null,1));

async function press(key,n){ await page.locator('.capa-manip rect[role=slider]').focus(); for(let i=0;i<n;i++) await page.keyboard.press(key); await page.waitForTimeout(120); }

// ¿alguna tecla mueve m?
const antes = await page.evaluate(()=>window.__tutoriaManipEstado ? null : null);
for (const k of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','+','-','Home','End','i','m']) {
  await press(k,1);
}
await page.waitForTimeout(200);
const trasTeclas = await page.evaluate(()=>document.querySelector('.lienzo svg')?.getAttribute('aria-label'));
console.log('ARIA tras probar 12 teclas distintas:', trasTeclas);
await browser.close();
