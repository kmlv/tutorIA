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
await page.goto('http://localhost:57330/?lang=es&t=84', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1200);

const snap = async (etiqueta) => {
  const r = await page.evaluate(() => {
    const t = window.__tutoria;
    const txt = s => { const e=document.querySelector(s); return e ? e.textContent.trim().slice(0,180) : null; };
    return {
      currentTime: t.media.currentTime(),
      duration: t.media.duration(),
      paused: t.media.paused(),
      ownsStage: t.media.ownsStage,
      reloj: txt('.transporte') || txt('#reloj') || null,
      captions: txt('.captions-band'),
      estado: (()=>{ try { const e = t.estado(); return {t: e.t, tiempo: e.tiempo, etapa: e.etapa, keys: Object.keys(e).slice(0,25)}; } catch(err){ return String(err); } })(),
    };
  });
  console.log('---', etiqueta, JSON.stringify(r, null, 1));
  return r;
};
const s0 = await snap('carga limpia ?t=84');

// texto completo de la barra inferior + inventario de controles
const barra = await page.evaluate(() => {
  const out = {};
  const sels = ['.transporte','.barra','footer','.controles','#play','#ask'];
  for (const s of sels) { const e=document.querySelector(s); if(e) out[s]=e.textContent.trim().replace(/\s+/g,' ').slice(0,300); }
  out.inputs = [...document.querySelectorAll('input,progress,[role=slider]')].map(e=>({tag:e.tagName, type:e.type||null, cls:e.className, role:e.getAttribute('role')}));
  out.botones = [...document.querySelectorAll('button')].map(b=>({id:b.id, cls:b.className, txt:b.textContent.trim().slice(0,40)}));
  return out;
});
console.log('=== BARRA/CONTROLES ===', JSON.stringify(barra, null, 1));

await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v84-carga.png'});

// pulsar Empezar
const play = await page.$('#play');
console.log('play encontrado:', !!play, play ? await play.textContent() : '');
await play.click();
await page.waitForTimeout(3000);
const s1 = await snap('3s tras Empezar');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v84-tras3s.png'});
await page.waitForTimeout(3000);
await snap('6s tras Empezar');
await browser.close();
