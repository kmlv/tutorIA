import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

console.log('--- estructura .captions-band (t=0) ---');
console.log(await page.evaluate(() => {
  const b=document.querySelector('.captions-band');
  return [...b.children].map(c=>c.tagName+'.'+c.className+' h='+Math.round(c.getBoundingClientRect().height)+' txt="'+(c.innerText||'').replace(/\s+/g,' ').trim().slice(0,80)+'"').join('\n');
}));

const snap = async (etq) => {
  const s = await page.evaluate(() => {
    const cap = document.querySelector('.captions-band');
    const en = document.querySelector('.q-enunciado');
    const q  = document.querySelector('.q');
    const ops = [...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.trim());
    return {
      t: window.__tutoria.media.currentTime(),
      pausado: window.__tutoria.media.paused(),
      qVisible: !!(q && q.getBoundingClientRect().height>0),
      qRect: q? q.getBoundingClientRect().toJSON() : null,
      enunciado: en? en.innerText.replace(/\s+/g,' ').trim() : null,
      opciones: ops,
      capInner: (cap.innerText||'').replace(/\s+/g,' ').trim(),   // innerText EN VIVO: solo lo visible
      capRect: cap.getBoundingClientRect().toJSON()
    };
  });
  console.log('\n=== '+etq+' ===');
  console.log('  t=', s.t.toFixed(3), 'pausado=', s.pausado);
  console.log('  PREGUNTA visible:', s.qVisible, 'rect y=', Math.round(s.qRect?.y), 'h=', Math.round(s.qRect?.height));
  console.log('  ENUNCIADO:', s.enunciado);
  console.log('  OPCIONES:', JSON.stringify(s.opciones));
  console.log('  BANDA rect y=', Math.round(s.capRect.y), 'h=', Math.round(s.capRect.height));
  console.log('  BANDA innerText EN VIVO:', s.capInner);
  return s;
};

// PRED 1
await page.evaluate('window.__tutoria.media.seek(84)');
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime() > 85', null, {timeout:20000});
await page.waitForTimeout(500);
await snap('PRED 1 (seek 84 -> Empezar -> pausa)');
await page.screenshot({path: OUT+'/p1-full.png'});
await page.locator('.captions-band').screenshot({path: OUT+'/p1-banda.png'});

// PRED 2: seguir
console.log('\n--- botones disponibles para continuar ---');
console.log(await page.evaluate(()=>[...document.querySelectorAll('button')].map(b=>b.innerText.trim()).filter(Boolean).join(' | ')));
await browser.close();
