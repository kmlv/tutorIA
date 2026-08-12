import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base=path.join(os.homedir(),'Library/Caches/ms-playwright');
const d=fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe=path.join(base,d,'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser=await chromium.launch({executablePath:exe,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await browser.newContext({viewport:{width:1280,height:860}});
const page=await ctx.newPage();
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const emp=page.locator('button',{hasText:'Empezar'}).first(); if(await emp.count()) await emp.click();
await page.waitForTimeout(500);
// CONTROL: abrir y cerrar el chat SIN preguntar nada
await page.click('#ask'); await page.waitForTimeout(600);
console.log('control: chat abierto, 0 msgs -> docH =', await page.evaluate(()=>document.documentElement.scrollHeight));
await page.locator('.dock-acciones button',{hasText:'Listo'}).first().click(); await page.waitForTimeout(1200);
console.log('control: chat cerrado, 0 msgs -> docH =', await page.evaluate(()=>document.documentElement.scrollHeight));
// UNA sola pregunta corta, luego cerrar
await page.click('#ask'); await page.waitForTimeout(500);
const a=await page.evaluate(()=>document.querySelectorAll('.dock .msg').length);
await page.fill('.composer-input','¿por qué?'); await page.press('.composer-input','Enter');
await page.waitForFunction(x=>document.querySelectorAll('.dock .msg').length>=x+2,a,{timeout:60000}).catch(()=>{});
await page.waitForTimeout(1500);
console.log('1 pregunta, chat abierto -> docH =', await page.evaluate(()=>document.documentElement.scrollHeight));
await page.locator('.dock-acciones button',{hasText:'Listo'}).first().click(); await page.waitForTimeout(1500);
const r=await page.evaluate(()=>({docH:document.documentElement.scrollHeight,
  dockW:Math.round(document.querySelector('.dock').getBoundingClientRect().width),
  dockH:Math.round(document.querySelector('.dock').getBoundingClientRect().height)}));
console.log('1 pregunta, chat CERRADO ->', JSON.stringify(r));
await browser.close();
