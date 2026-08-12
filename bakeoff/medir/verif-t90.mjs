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
await page.goto('http://localhost:57330/?lang=es&t=90', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1200);

const snap = async (etiqueta) => {
  const s = await page.evaluate(() => {
    const t = window.__tutoria;
    const txt = (sel) => { const e=document.querySelector(sel); return e ? e.textContent.trim().slice(0,120) : null; };
    // buscar textos con formato reloj m:ss en la barra inferior
    const relojes = [...document.querySelectorAll('body *')]
      .filter(e=>e.children.length===0 && /^\d+:\d\d(\s*\/\s*\d+:\d\d)?$/.test(e.textContent.trim()))
      .map(e=>({cls:e.className, txt:e.textContent.trim()}));
    return {
      currentTime: t.media.currentTime(),
      duration: t.media.duration(),
      paused: t.media.paused(),
      ownsStage: t.media.ownsStage,
      relojes,
      estadoKeys: Object.keys(t.estado()||{}),
      captions: txt('.captions-band'),
      escenarioTxt: (document.querySelector('.escenario')?.innerText||'').replace(/\s+/g,' ').slice(0,300),
    };
  });
  console.log('--- ' + etiqueta);
  console.log(JSON.stringify(s, null, 1));
  return s;
};

console.log('=== A) CARGA LIMPIA ?t=90 (variante por defecto) ===');
const a = await snap('tras cargar');
await page.screenshot({path:'verif-t90-carga.png'});

// Estado del gráfico serializado, para comparar con t=0
const est90 = await page.evaluate(()=>JSON.stringify(window.__tutoria.estado()));

// Pulsar Empezar / play
const botones = await page.evaluate(()=>[...document.querySelectorAll('button, #play, #ask')]
  .map(b=>({id:b.id, cls:b.className, txt:(b.textContent||'').trim().slice(0,40)})).slice(0,40));
console.log('BOTONES:', JSON.stringify(botones));

const play = await page.$('#play');
if (play) { await play.click(); } else { console.log('NO HAY #play'); }
await page.waitForTimeout(5000);
const b = await snap('5 s tras pulsar play');
await page.screenshot({path:'verif-t90-play.png'});
fs.writeFileSync('/private/tmp/est90.json', est90);
await browser.close();
