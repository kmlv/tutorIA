import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const OUT='/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif';
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const meta = await page.evaluate(()=>({
  cues: (window.__tutoriaSesion.media.cues||[]).map(c=>({t:+(c.t??c.tiempo).toFixed(1),tipo:c.tipo||c.type})).slice(0,10),
  controles: [...document.querySelectorAll('input[type=range], .scrub, .barra, progress')].map(e=>e.tagName+'.'+e.className),
  botones: [...document.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim().slice(0,30)),
}));
console.log('primeros cues:', JSON.stringify(meta.cues));
console.log('controles de seek:', JSON.stringify(meta.controles));
console.log('botones visibles al cargar:', JSON.stringify(meta.botones));

const dur = await page.evaluate(()=>window.__tutoria.media.duration());
await page.evaluate((dur)=>{window.__tutoria.media.seek(dur-1.2);return window.__tutoria.media.play();},dur);
await page.waitForSelector('.q',{timeout:30000});
await page.waitForTimeout(1200);
const q1 = await page.evaluate(()=>document.querySelector('.q-enunciado').textContent.trim());
console.log('pregunta de practica pendiente:', q1);
await page.locator('.dock-acciones button',{hasText:'Listo, sigamos'}).click();
await page.waitForTimeout(1500);
// dejar correr hasta el primer cue de prediccion (el alumno llegaria esperando)
await page.evaluate(()=>{window.__tutoria.media.seek(20.0); return window.__tutoria.media.play();});
await page.waitForTimeout(9000);
const s = await page.evaluate(()=>({
  t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(),
  dock:window.__tutoria.dock.actual,
  nPreguntas: document.querySelectorAll('.q').length,
  enunciados: [...document.querySelectorAll('.q-enunciado')].map(e=>e.textContent.trim().slice(0,70)),
  dockMsgs:[...document.querySelectorAll('.dock-body .msg')].map(m=>m.textContent.trim().slice(0,50)),
}));
console.log('== tras dejar correr ==', JSON.stringify(s,null,1));
await page.screenshot({path:`${OUT}/30-dos-preguntas.png`});
await browser.close();
