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
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,250)); });

console.log('== 1) carga limpia es/B ==');
await page.goto('http://localhost:57330/?lang=es&variant=B', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('== 2) Empezar + avanzar a 1:02 ==');
await page.click('#play');
await page.waitForTimeout(1200);
await page.evaluate('window.__tutoria.media.seek(62)');
await page.waitForTimeout(1500);
console.log('   reloj es/B:', await page.$eval('.reloj, .tiempo, #reloj', e=>e.textContent).catch(()=>'(no encontrado)'));

console.log('== 3) clic en el enlace "English" ==');
await Promise.all([
  page.waitForNavigation({waitUntil:'domcontentloaded'}).catch(()=>{}),
  page.click('a:has-text("English")'),
]);
await page.waitForTimeout(4000);
console.log('   URL:', page.url());

const snap = async (tag) => {
  const o = await page.evaluate(() => ({
    tuto: typeof window.__tutoria,
    titulo: document.querySelector('h1,.titulo,.lesson-title')?.textContent?.trim() || null,
    play: document.querySelector('#play')?.textContent?.trim() || null,
    playDisabled: document.querySelector('#play')?.disabled ?? null,
    ask: document.querySelector('#ask')?.textContent?.trim() || null,
    askDisabled: document.querySelector('#ask')?.disabled ?? null,
    reloj: [...document.querySelectorAll('.controles *, .controls *')].map(e=>e.textContent.trim()).filter(t=>/^\d+:\d\d$/.test(t))[0] || null,
    videoSrc: document.querySelector('video')?.currentSrc ?? '(no video el)',
    escenarioHTML: (document.querySelector('.escenario')?.innerHTML || '').length,
    lienzoHTML: (document.querySelector('.lienzo')?.innerHTML || '').length,
    dockClass: document.querySelector('.dock')?.className || null,
    appText: (document.getElementById('app')?.textContent||'').slice(0,120),
    bodyText: document.body.innerText.replace(/\n+/g,' | ').slice(0,400),
  }));
  console.log(`   [${tag}]`, JSON.stringify(o, null, 1));
};
await snap('tras cargar en/B');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v2-enB-cargado.png'});

console.log('== 5) pulsar Start ==');
await page.click('#play').catch(e=>console.log('   click Start fallo:', e.message.slice(0,120)));
await page.waitForTimeout(3000);
await snap('tras Start');

console.log('== 5b) pulsar Ask ==');
await page.click('#ask').catch(e=>console.log('   click Ask fallo:', e.message.slice(0,120)));
await page.waitForTimeout(2000);
console.log('   dock estado (via __tutoria):', await page.evaluate('window.__tutoria ? window.__tutoria.dock.actual : "__tutoria undefined"'));
console.log('   dock class:', await page.$eval('.dock', e=>e.className).catch(()=>'(sin .dock)'));
console.log('   composer visible:', await page.$eval('.composer-input', e=>!!(e.offsetParent)).catch(()=>'(sin .composer-input)'));

console.log('== 5c) escribir y enviar ==');
const ci = await page.$('.composer-input');
if (ci) {
  await ci.click(); await ci.type('why does the line slope down?');
  await page.click('.composer-enviar').catch(e=>console.log('   enviar fallo:', e.message.slice(0,120)));
  await page.waitForTimeout(4000);
  console.log('   dock tras enviar:', await page.$eval('.dock', e=>e.innerText.replace(/\n+/g,' | ').slice(0,300)).catch(()=>'(sin dock)'));
} else console.log('   NO hay .composer-input');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v3-enB-final.png'});

console.log('== acciones disponibles: todos los botones/enlaces habilitados ==');
console.log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('button,a,[role=button]')]
  .filter(e=>e.offsetParent!==null).map(e=>({t:e.textContent.trim().slice(0,30), dis:e.disabled||false, href:e.getAttribute?.('href')||null})))));
await browser.close();
