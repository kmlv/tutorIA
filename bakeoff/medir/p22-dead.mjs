import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,120)));
await page.goto('http://localhost:57330/?lang=en&variant=B',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(3000);
const before = await page.evaluate(`document.body.innerText`);
await page.evaluate(`(()=>{ for(const s of ['#play','#ask','.composer-enviar']) { const e=document.querySelector(s); if(e) e.click(); } })()`);
await page.evaluate(`(()=>{const i=document.querySelector('.composer-input'); if(i){i.value='help'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));} })()`);
await page.waitForTimeout(4000);
const after = await page.evaluate(`document.body.innerText`);
console.log('cambió algo tras pulsar todo?', before!==after);
console.log('estado final:', JSON.stringify(await page.evaluate(`({
 reloj:[...document.querySelectorAll('*')].map(e=>e.textContent).find(s=>/^\\d:\\d\\d$/.test(s)),
 play:document.querySelector('#play').textContent, playDisabled:document.querySelector('#play').disabled,
 dock:document.querySelector('.dock').getAttribute('data-estado'),
 videoSrc:document.querySelector('video').currentSrc, videoErr:(document.querySelector('video').error||{}).code,
 hook:!!window.__tutoria})`)));
// transcript?
const t = await page.$('summary');
if (t) { await t.click(); await page.waitForTimeout(800); console.log('transcripcion abre:', (await page.evaluate(`document.body.innerText`)).length > before.length); }
await browser.close();
