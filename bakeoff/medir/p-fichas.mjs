import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e=>console.log('  JS ERROR:', String(e).slice(0,180)));
await page.addInitScript(()=>{window.__log=[];const of=window.fetch;window.fetch=async(...a)=>{const url=typeof a[0]==='string'?a[0]:a[0].url;const req=a[1]&&a[1].body?String(a[1].body):null;const r=await of(...a);if(/\/(next|answer)/.test(url)){r.clone().text().then(t=>window.__log.push({url:url.replace(/^.*\/api/,''),req,resp:t})).catch(()=>{});}return r;};});
await page.goto('http://localhost:57330/?lang=es&t=180',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0');
await page.waitForTimeout(600);
const fichas = ()=>page.evaluate(()=>[...document.querySelectorAll('.bands .band, .bands *')].filter(e=>/\$/.test(e.textContent)&&e.children.length===0).map(e=>e.textContent.trim()));
console.log('FICHAS con t=180:', await fichas());
await page.evaluate('window.__tutoria.practice.start(); 1');
const U = util(page);
for(let i=0;i<6;i++){
  const n=await U.nPreg(); if(!await U.esperarNueva(n-1,15000))break;
  await page.waitForTimeout(400);
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip') && q.id==='q_cs_m_manip'){
    await U.dragSvg([px(33.333),py(0)],[px(50),py(0)]);
    await U.dragSvg([px(0),py(100)],[px(0),py(150)]);
    console.log('ARIA del grafico tras respuesta CORRECTA:', await page.evaluate(()=>document.querySelector('svg.bgraph').getAttribute('aria-label')));
    console.log('FICHAS a la vez:', await fichas());
    await page.evaluate('document.scrollingElement.scrollTop=0');
    await page.screenshot({path:SP+'fichas-vs-grafico.png'});
    await U.clickJS(sel+'button:not([disabled])'); await page.waitForTimeout(1500);
    console.log('veredicto:', (await msgs(page)).slice(-1));
    console.log('ARIA despues:', await page.evaluate(()=>document.querySelector('svg.bgraph').getAttribute('aria-label')));
    break;
  }
  if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input','1');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','x');await U.clickJS(sel+'button[type=submit]');}
  else await U.clickJS(sel+'button:not([disabled])');
}
await browser.close();
