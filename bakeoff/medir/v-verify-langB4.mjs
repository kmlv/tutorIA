import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));

const inventario = async () => await page.evaluate(() => ({
  dockClass: document.querySelector('.dock')?.className,
  dockAttrs: [...(document.querySelector('.dock')?.attributes||[])].map(a=>a.name+'='+a.value),
  transcriptEl: [...document.querySelectorAll('*')].filter(e=>e.childElementCount===0 && /transcript|transcripci/i.test(e.textContent||'')).map(e=>e.tagName+'.'+e.className+' :: '+e.textContent.trim().slice(0,30)),
  captionsBand: document.querySelector('.captions-band') ? {cls:document.querySelector('.captions-band').className, txt:document.querySelector('.captions-band').innerText.slice(0,80), vis:!!document.querySelector('.captions-band').offsetParent} : null,
  escenarioAttr: document.querySelector('.escenario')?.getAttribute('data-escenario'),
  qPresente: !!document.querySelector('.q'),
}));

console.log('=== en/B (roto) ===');
await page.goto('http://localhost:57330/?lang=en&variant=B', {waitUntil:'domcontentloaded'});
await page.waitForTimeout(3500);
console.log(JSON.stringify(await inventario(), null, 1));
await page.evaluate('document.querySelector("#ask").click()'); await page.waitForTimeout(800);
console.log(' tras Ask:', JSON.stringify(await inventario(), null, 1));
// probar el Transcript
const tr = await page.$('text=/^Transcript$/');
if (tr) { await tr.click({force:true}).catch(e=>console.log(' transcript click err', e.message.slice(0,80))); await page.waitForTimeout(1500);
  console.log(' tras Transcript -> texto largo?', await page.evaluate('document.body.innerText.length')); }
// probar ?t=
await page.goto('http://localhost:57330/?lang=en&variant=B&t=95', {waitUntil:'domcontentloaded'});
await page.waitForTimeout(3500);
console.log(' con ?t=95 -> __tutoria:', await page.evaluate('typeof window.__tutoria'), '| reloj:', await page.evaluate(`[...document.querySelectorAll('*')].map(e=>e.childElementCount===0?e.textContent.trim():'').filter(t=>/^\\d+:\\d\\d$/.test(t))[0]`));

console.log('\n=== en/A (sano), para comparar el dock ===');
await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:20000});
console.log(' antes de Ask:', JSON.stringify(await inventario()), '| dock.actual =', await page.evaluate('window.__tutoria.dock.actual'));
await page.evaluate('document.querySelector("#ask").click()'); await page.waitForTimeout(1000);
console.log(' tras Ask :', JSON.stringify(await inventario()), '| dock.actual =', await page.evaluate('window.__tutoria.dock.actual'));
console.log(' #play tras Ask:', await page.$eval('#play', e=>e.textContent));
await browser.close();
