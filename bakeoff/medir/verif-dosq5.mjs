import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const run = async (modo) => {
  const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
  const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
  await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
  await page.waitForTimeout(500);
  if (modo === 'seguir') { await page.click('#play'); }
  else { await page.evaluate(()=>{ const b=[...document.querySelectorAll('.dock-acciones button')]
            .find(x=>x.textContent.trim().startsWith('Listo')); b.click(); }); }
  await page.waitForTimeout(1200);
  const tras = await page.evaluate(()=>({nQ:document.querySelectorAll('.q').length, paused:window.__tutoria.media.paused()}));
  await page.evaluate(() => { window.__tutoria.media.play(); window.__tutoria.media.seek(192.5); window.__tutoria.media.play(); });
  await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>194', null, {timeout:40000}).catch(()=>{});
  await page.waitForTimeout(1200);
  const r = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2),
     nQ:document.querySelectorAll('.q').length,
     enun:[...document.querySelectorAll('.q-enunciado')].map(e=>e.textContent.trim().slice(0,55)),
     cp1opts:[...(document.querySelectorAll('.q')[0]?.querySelectorAll('.q-opciones button')||[])].map(b=>b.disabled)}));
  console.log('\n### modo="'+modo+'"  tras la accion: .q='+tras.nQ+' paused='+tras.paused);
  console.log('    en cp2 -> ' + JSON.stringify(r));
  await page.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-${modo}.png`});
  await browser.close();
};
await run('seguir');
await run('listo');
