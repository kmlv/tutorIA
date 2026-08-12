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

const sesiones = [];
page.on('response', async r => {
  if (r.url().includes('/api/session') && r.request().method()==='POST') {
    try { const j = await r.json(); sesiones.push(j.session_id || JSON.stringify(j).slice(0,60)); } catch(e){}
  }
});

let dialogo = null;
page.on('dialog', async dlg => { dialogo = dlg.type()+': '+dlg.message(); await dlg.accept(); });

await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const dump = async (etiqueta) => {
  const o = await page.evaluate(() => {
    const reloj = document.querySelector('.reloj, .tiempo, .time');
    const qs = [...document.querySelectorAll('.q')].map(q => ({
      enunciado: (q.querySelector('.q-enunciado')?.textContent||'').trim().slice(0,70),
      opciones: [...q.querySelectorAll('.q-opciones button')].map(b=>b.className)
    }));
    return {
      url: location.search,
      t: window.__tutoria.media.currentTime().toFixed(1),
      paused: window.__tutoria.media.paused(),
      relojTxt: reloj ? reloj.textContent.trim() : '(sin .reloj)',
      dockTxt: (document.querySelector('.dock')?.innerText||'').replace(/\s+/g,' ').trim().slice(0,220),
      nQ: qs.length,
      qs,
      ls: Object.keys(localStorage).length, ss: Object.keys(sessionStorage).length,
    };
  });
  console.log('['+etiqueta+']', JSON.stringify(o, null, 1));
};

// PASO 2: Empezar
const empezar = page.locator('#play');
console.log('boton play texto:', await empezar.textContent());
await empezar.click();
await page.waitForTimeout(500);

// avanzar hasta poco antes de 87 y dejar correr
await page.evaluate(() => window.__tutoria.media.seek(83));
await page.waitForFunction('document.querySelector(".q") || window.__tutoria.media.currentTime() > 95', null, {timeout:60000});
await page.waitForTimeout(800);
await dump('llega pregunta ~87');

// responder
let btn = page.locator('.q .q-opciones button').first();
if (await btn.count()) { await btn.click(); await page.waitForTimeout(1200); }
await dump('tras responder pred 87');

// reanudar si esta pausado
if (await page.evaluate(()=>window.__tutoria.media.paused())) {
  await page.locator('#play').click(); await page.waitForTimeout(300);
}
await page.evaluate(() => window.__tutoria.media.seek(141));
await page.waitForFunction('document.querySelectorAll(".q").length >= 2 || window.__tutoria.media.currentTime() > 152', null, {timeout:60000});
await page.waitForTimeout(1000);
await dump('llega cp1 ~144.8');

const btns = page.locator('.q').last().locator('.q-opciones button');
if (await btns.count()) { await btns.first().click(); await page.waitForTimeout(1200); }
await dump('ANTES de pulsar English');

await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/kv-antes.png'});

const enlace = page.locator('a.idioma');
console.log('enlace idioma:', await enlace.textContent(), '->', await enlace.getAttribute('href'));

await enlace.click();
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2500);
await dump('DESPUES de English');
console.log('dialogo de confirmacion:', dialogo);
console.log('session_ids vistos:', sesiones);
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/kv-despues.png'});

// boton atras
await page.goBack({waitUntil:'domcontentloaded'});
await page.waitForTimeout(2500);
await dump('tras boton ATRAS');
console.log('session_ids tras atras:', sesiones);

await browser.close();
