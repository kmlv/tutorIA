import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const cues = await page.evaluate(()=> (window.__tutoriaSesion?.media?.cues||[]).filter(c=>(c.tipo||c.type)==='checkpoint').map(c=>({t:c.t,id:c.id})));
console.log('checkpoints: ' + JSON.stringify(cues));

await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
await page.click('#play'); await page.waitForTimeout(600);
await page.evaluate(() => { window.__tutoria.media.seek(192.5); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
await page.waitForTimeout(1200);
const antes = await page.evaluate(()=>JSON.stringify(window.__tutoria.estado()));
console.log('\nESTADO antes de contestar la vieja: ' + antes);

// contestar MAL la vieja: opcion 2 "Se vuelve mas plana"
await page.evaluate(() => document.querySelectorAll('.q')[0].querySelectorAll('.q-opciones button')[1].click());
await page.waitForTimeout(2000);
const despues = await page.evaluate(()=>JSON.stringify(window.__tutoria.estado()));
console.log('ESTADO despues de contestar MAL la vieja: ' + despues);
console.log('CAMBIO EN EL GRAFICO: ' + (antes!==despues ? '*** SI, el grafico cambio ***' : 'no'));
const txt = await page.evaluate(()=>{ const b=document.querySelector('.dock-body');
  return [...b.children].map(e=>e.className+' :: '+(e.innerText||'').replace(/\n+/g,' | ').slice(0,150)); });
console.log('DOCK BODY:'); txt.forEach(t=>console.log('   '+t));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-mal.png'});

// seguir hasta el siguiente checkpoint: ¿se apilan 3?
await page.click('#play'); await page.waitForTimeout(400);
await page.evaluate(() => { window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>200', null, {timeout:120000}).catch(e=>console.log('timeout esperando cp3'));
await page.waitForTimeout(1200);
const n = await page.evaluate(()=>({t:+window.__tutoria.media.currentTime().toFixed(2), n:document.querySelectorAll('.q').length,
  enun:[...document.querySelectorAll('.q-enunciado')].map(e=>e.textContent.trim().slice(0,60)),
  habilitadas:[...document.querySelectorAll('.q-opciones button')].map(b=>b.disabled)}));
console.log('\nTRAS SEGUIR: ' + JSON.stringify(n, null, 1));
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-cp3.png'});
await browser.close();
