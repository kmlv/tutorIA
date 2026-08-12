import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for(const intento of [1,2]){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
  await page.click('#play'); await page.waitForTimeout(5000);
  const nDibujado = await page.evaluate(()=>{const l=document.querySelector('.lienzo'); const s=l.querySelector('svg'); return s?[...s.querySelectorAll('line,path,circle,text,polygon')].length:0;});
  await page.click('#ask'); await page.waitForTimeout(500);
  await page.fill('.composer-input','¿qué es la línea presupuestaria?');
  await page.click('.composer-enviar');
  await page.waitForFunction(()=>!document.querySelector('.composer-enviar').disabled,null,{timeout:60000});
  await page.waitForTimeout(500);
  const resp = await page.evaluate(()=>{const t=document.querySelector('.dock').innerText.split('\n').filter(x=>x.trim()); return t[t.indexOf('¿qué es la línea presupuestaria?')+1]||t.slice(-8).join(' / ');});
  console.log(`intento ${intento}: elementos dibujados en el lienzo=${nDibujado} | t=${await page.evaluate(()=>+window.__tutoria.media.currentTime().toFixed(1))}`);
  console.log('  respuesta:', JSON.stringify(resp.slice(0,400)));
  await ctx.close();
}
await browser.close();
