import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base,d,'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
let nChat=0; page.on('request',r=>{if(r.method()==='POST'&&/\/chat$/.test(new URL(r.url()).pathname))nChat++;});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000});
await page.locator('#ask').first().click(); await page.waitForTimeout(400);
const inp=page.locator('.composer-input');
async function esperarTutor(n){await page.waitForFunction(`(()=>{const a=[...document.querySelectorAll('.dock-body > *')];return a.length>=${n}&&a[a.length-1].className.includes('tutor');})()`,null,{timeout:40000});await page.waitForTimeout(250);}
for(let i=0;i<12;i++){await inp.click({force:true});await inp.fill('pregunta numero '+(i+1));await page.keyboard.press('Enter');await esperarTutor((i+1)*2);}
// agotar de verdad: un envio mas por teclado para que el servidor devuelva limite_alcanzado
await page.keyboard.type('uno mas'); await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
console.log('data-agotado ahora:', await page.evaluate(`document.querySelector('.composer').getAttribute('data-agotado')`));
console.log('POST /chat hasta ahora:', nChat);
// ¿los botones de intencion siguen vivos?
const info = await page.evaluate(`(()=>{const b=[...document.querySelectorAll('.intencion')];return b.map(x=>({t:x.textContent,dis:x.disabled,pe:getComputedStyle(x).pointerEvents,op:getComputedStyle(x).opacity}));})()`);
console.log('botones de intencion:', JSON.stringify(info));
const antes=nChat, nb=await page.locator('.dock-body > *').count();
await page.locator('.intencion', {hasText:'No entiendo'}).click();
await page.waitForTimeout(4000);
console.log(`tras pulsar "No entiendo": POST /chat nuevos=${nChat-antes} burbujas ${nb} -> ${await page.locator('.dock-body > *').count()}`);
const ult=await page.evaluate(`(()=>{const a=[...document.querySelectorAll('.dock-body > *')];return a.slice(-2).map(x=>x.className+' :: '+x.textContent.trim().slice(0,100));})()`);
ult.forEach(u=>console.log('   ',u));
await browser.close();
