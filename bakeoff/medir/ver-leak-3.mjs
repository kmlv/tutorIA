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

// estado inicial: subtitulos activados por defecto?
const capIni = await page.evaluate(() => {
  const b = document.querySelector('.captions-band');
  if (!b) return {existe:false};
  const cs = getComputedStyle(b);
  return {existe:true, display:cs.display, visibility:cs.visibility, opacity:cs.opacity,
          alto:b.getBoundingClientRect().height, texto:(b.innerText||'').trim().slice(0,200),
          clases:b.className};
});
console.log('CAPTIONS al cargar (t=0, sin tocar nada):', JSON.stringify(capIni));

// hay algun toggle de subtitulos?
const toggles = await page.evaluate(() => [...document.querySelectorAll('button,[role=switch],input[type=checkbox]')]
  .map(e=>({tag:e.tagName, id:e.id, cls:e.className, txt:(e.innerText||e.value||'').trim().slice(0,40), aria:e.getAttribute('aria-pressed')||e.getAttribute('aria-checked')}))
  .filter(x=>/sub|cap|cc|titul/i.test(x.cls+x.id+x.txt)));
console.log('toggles de subtitulos:', JSON.stringify(toggles));

// el boton de play
const playTxt = await page.evaluate(() => { const p=document.querySelector('#play'); return p? {txt:p.innerText.trim(), aria:p.getAttribute('aria-label')} : null; });
console.log('#play ->', JSON.stringify(playTxt));
await page.screenshot({path: OUT+'/00-carga.png'});
await browser.close();
