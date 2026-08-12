import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const net = [];
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('request', r => { const u=r.url(); if(u.includes('/api/')) net.push({m:r.method(), u:u.replace(/^.*\/api/,'/api').replace(/session\/[0-9a-f]+/,'session/SID'), body:r.postData()?.slice(0,300)}); });
page.on('response', async r => { const u=r.url(); if(u.includes('/answer')||u.includes('/next')) { try{ net.push({m:'RESP '+r.status(), u:u.replace(/^.*\/api/,'/api').replace(/session\/[0-9a-f]+/,'session/SID'), body:(await r.text()).slice(0,500)}); }catch(e){} } });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(`__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();`);
await page.waitForSelector('.q', {timeout:40000});
await page.waitForTimeout(1200);
await page.getByRole('button', {name:'Se vuelve más plana', exact:true}).first().click();
await page.waitForFunction(`document.querySelectorAll('.q-manip').length > 0`, null, {timeout:25000});
await page.waitForTimeout(1800);

const tiradores = await page.$$('.tirador');
console.log('tiradores visibles:', tiradores.length);
const boxes = await Promise.all(tiradores.map(t=>t.boundingBox()));
console.log('cajas:', JSON.stringify(boxes));
// arrastrar el primer tirador un poco
const b = boxes.find(x=>x);
if (b) {
  const cx = b.x + b.width/2, cy = b.y + b.height/2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx+40, cy-40, {steps:12});
  await page.mouse.up();
  await page.waitForTimeout(600);
}
const dockAntes = await page.evaluate(`document.querySelector('.dock').innerText`);
const marca = net.length;
await page.evaluate(() => { const ms=[...document.querySelectorAll('.q-manip')]; const l=ms[ms.length-1]; [...l.querySelectorAll('button')].find(x=>/listo/i.test(x.textContent)).click(); });
await page.waitForTimeout(3000);
const dockDespues = await page.evaluate(`document.querySelector('.dock').innerText`);
console.log('=== TRAS ARRASTRAR Y PULSAR LISTO ===');
console.log('TEXTO NUEVO:', JSON.stringify(dockDespues.slice(dockAntes.length-30).trim().split('\n').map(s=>s.trim()).filter(Boolean)));
console.log('RED:', JSON.stringify(net.slice(marca), null, 1));
await page.screenshot({path:'v4-arrastrado.png'});
await browser.close();
