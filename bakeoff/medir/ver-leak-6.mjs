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

const snap = async (etq) => {
  const s = await page.evaluate(() => {
    const cap = document.querySelector('.captions-band');
    const en = document.querySelector('.q-enunciado');
    const ops = [...document.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\s+/g,' ').trim());
    const full = (cap.innerText||'').replace(/\s+/g,' ').trim();
    const linea = full.replace(/\s*(Ocultar|Mostrar) subtítulos\s*Transcripción\s*$/,'').trim();
    return { t: window.__tutoria.media.currentTime(), pausado: window.__tutoria.media.paused(),
             enunciado: en? en.innerText.replace(/\s+/g,' ').trim() : null, opciones: ops, cap: linea };
  });
  console.log('\n=== '+etq+' ===  t='+s.t.toFixed(3)+' pausado='+s.pausado);
  console.log('  PREGUNTA : '+s.enunciado);
  s.opciones.forEach((o,i)=>console.log('    ['+i+'] '+o));
  console.log('  SUBTITULO: '+s.cap);
  return s;
};

// PRED 1
await page.evaluate('window.__tutoria.media.seek(84)');
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>85', null, {timeout:20000});
await page.waitForTimeout(400);
await snap('PRED 1');

// PRED 2 : seek 121 + Seguir
await page.evaluate('window.__tutoria.media.seek(121)');
await page.waitForTimeout(300);
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>122', null, {timeout:20000});
await page.waitForTimeout(400);
await snap('PRED 2');
await page.screenshot({path: OUT+'/p2-full.png'});

// PRED 3 : seek 174 + Seguir
await page.evaluate('window.__tutoria.media.seek(174)');
await page.waitForTimeout(300);
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>175', null, {timeout:20000});
await page.waitForTimeout(400);
await snap('PRED 3');
await page.screenshot({path: OUT+'/p3-full.png'});
await browser.close();
