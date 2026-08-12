import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SC='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
const ready = async()=>page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
const st = async()=>page.evaluate(()=>{
  const el=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0&&/^\d+:\d\d/.test((e.textContent||'').trim()));
  return {ct:+window.__tutoria.media.currentTime().toFixed(2), reloj:el&&el.textContent.trim(),
    play:document.querySelector('#play')?.textContent.trim(), url:location.href};});

console.log('=== PASO B: reproducir de 0 a 1:41 y pulsar English ===');
await page.goto('http://localhost:57330/?lang=es&t=0',{waitUntil:'domcontentloaded'}); await ready();
await page.click('#play');
await page.waitForFunction('window.__tutoria.media.currentTime() > 101', null, {timeout:150000});
console.log('antes:', JSON.stringify(await st()));
await page.screenshot({path:SC+'B1.png'});
const barra = await page.evaluate(()=>{
  const a=Array.from(document.querySelectorAll('a')).find(a=>/English/i.test(a.textContent));
  return {href:a&&a.getAttribute('href'), barraTexto:a&&a.parentElement&&a.parentElement.innerText.replace(/\n/g,' | ')};});
console.log('barra transporte:', JSON.stringify(barra));
await page.click('a[href*="lang=en"]'); await page.waitForLoadState('domcontentloaded'); await ready(); await page.waitForTimeout(1000);
console.log('DESPUES de English:', JSON.stringify(await st()));
await page.screenshot({path:SC+'B2.png'});

console.log('\n=== PASO C: buscar cualquier forma de volver ===');
await page.goto('http://localhost:57330/?lang=es&t=0',{waitUntil:'domcontentloaded'}); await ready();
await page.click('#play'); await page.waitForFunction('window.__tutoria.media.currentTime() > 20',null,{timeout:60000});
await page.click('#play'); // pausa
await page.waitForTimeout(400);
const t0 = await page.evaluate('window.__tutoria.media.currentTime()');
console.log('pausado en', t0.toFixed(2));
console.log('controles de seek:', await page.evaluate(()=>document.querySelectorAll('input[type=range],progress,[role=slider]').length));
// clic en el reloj
const relojClick = await page.evaluate(()=>{const el=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0&&/^\d+:\d\d/.test((e.textContent||'').trim())); if(el){el.click(); return el.outerHTML.slice(0,150);} return null;});
await page.waitForTimeout(400);
console.log('tras clic en reloj:', relojClick, '-> ct=', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2));
// teclas
await page.evaluate(()=>{const b=document.querySelector('#play'); b.focus();});
for (const k of ['ArrowLeft','ArrowRight','Home','End','j','l','k','0','Space','PageDown']){
  const antes = await page.evaluate('window.__tutoria.media.currentTime()');
  await page.keyboard.press(k==='Space'?' ':k); await page.waitForTimeout(350);
  const desp = await page.evaluate('window.__tutoria.media.currentTime()');
  console.log(`  tecla ${k}: ${antes.toFixed(2)} -> ${desp.toFixed(2)} (delta ${(desp-antes).toFixed(2)})`);
  if (Math.abs(desp-antes)>0.5) { await page.evaluate(v=>window.__tutoria.media.seek(v), antes); await page.waitForTimeout(200); }
}
// transcripcion
const tr = await page.evaluate(()=>{
  const b=Array.from(document.querySelectorAll('button,summary,a,[role=button]')).find(e=>/Transcrip/i.test(e.textContent||''));
  if(b) b.click(); return b?b.outerHTML.slice(0,200):null;});
await page.waitForTimeout(700);
console.log('transcripcion abierta con:', tr);
const lineas = await page.evaluate(()=>{
  const cand=Array.from(document.querySelectorAll('li,p,div')).filter(e=>e.children.length===0 && (e.textContent||'').trim().length>25);
  return cand.slice(0,25).map(e=>({tag:e.tagName, cls:e.className, txt:(e.textContent||'').trim().slice(0,70), clickable: e.tagName==='BUTTON'||e.tagName==='A'||e.hasAttribute('role')||e.hasAttribute('onclick')||getComputedStyle(e).cursor==='pointer'}));});
console.log('lineas transcripcion:', JSON.stringify(lineas.slice(0,12),null,1));
const objetivo = await page.evaluate(()=>{
  const el=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0 && /aumento del ingreso|hacia afuera/i.test(e.textContent||''));
  if(!el) return null; const before=window.__tutoria.media.currentTime(); el.click();
  return {txt:el.textContent.trim().slice(0,80), tag:el.tagName, cls:el.className, before};});
await page.waitForTimeout(600);
console.log('clic en linea transcripcion:', JSON.stringify(objetivo), '-> ct=', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2));
await page.screenshot({path:SC+'C-transcripcion.png', fullPage:true});
await browser.close();
