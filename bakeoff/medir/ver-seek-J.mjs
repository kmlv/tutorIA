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
await page.goto('http://localhost:57330/?lang=es&t=0',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.click('#play'); await page.waitForFunction('window.__tutoria.media.currentTime()>25',null,{timeout:60000});
await page.click('#play'); await page.waitForTimeout(500);
console.log('pausado en', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2));
console.log('controles seek (range/progress/slider):', await page.evaluate(()=>document.querySelectorAll('input[type=range],progress,[role=slider]').length));
console.log('elementos con cursor pointer en la barra:', await page.evaluate(()=>{
  const a=Array.from(document.querySelectorAll('a')).find(a=>/English/i.test(a.textContent));
  const bar=a&&a.parentElement; if(!bar) return null;
  return Array.from(bar.children).map(c=>({tag:c.tagName,cls:c.className,txt:c.textContent.trim().slice(0,20),cursor:getComputedStyle(c).cursor}));}));
// clic + doble clic en el reloj
const rel = await page.evaluate(()=>{const el=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0&&/^\d+:\d\d$/.test((e.textContent||'').trim())); return el?{html:el.outerHTML.slice(0,160)}:null;});
console.log('reloj:', JSON.stringify(rel));
const b4 = await page.evaluate('window.__tutoria.media.currentTime()');
await page.evaluate(()=>{const el=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0&&/^\d+:\d\d$/.test((e.textContent||'').trim())); el&&el.click(); el&&el.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));});
await page.waitForTimeout(600);
console.log('tras clic/dblclic reloj:', b4.toFixed(2), '->', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2));
// teclas con foco en el reproductor
for (const k of ['ArrowLeft','ArrowRight','Home','End','j','l','k','0','PageDown',' ']){
  await page.evaluate(()=>document.querySelector('#play').focus());
  const a1 = await page.evaluate('window.__tutoria.media.currentTime()');
  await page.keyboard.press(k===' '?'Space':k); await page.waitForTimeout(450);
  const a2 = await page.evaluate('window.__tutoria.media.currentTime()');
  const p = await page.evaluate('window.__tutoria.media.paused()');
  console.log(`  ${JSON.stringify(k)}: ${a1.toFixed(2)} -> ${a2.toFixed(2)} (d=${(a2-a1).toFixed(2)}) paused=${p}`);
  if(!p){ await page.click('#play'); await page.waitForTimeout(300); }
}
// transcripcion
const opened = await page.evaluate(()=>{const b=Array.from(document.querySelectorAll('button,summary,a,[role=button],[class*=transcri]')).find(e=>/Transcrip/i.test(e.textContent||'')); if(b){b.click(); return b.tagName+'.'+b.className;} return null;});
await page.waitForTimeout(900);
console.log('transcripcion:', opened);
const info = await page.evaluate(()=>{
  const cont = Array.from(document.querySelectorAll('ol,ul,div')).filter(e=>e.innerText&&e.innerText.length>200&&/aumento del ingreso|ingreso mueve/i.test(e.innerText))[0];
  const hijos = cont? Array.from(cont.children).slice(0,8).map(c=>({tag:c.tagName,cls:c.className,cursor:getComputedStyle(c).cursor,btn:!!c.querySelector('button,a'),txt:c.innerText.trim().slice(0,60)})):null;
  return {cont: cont&&cont.tagName+'.'+cont.className, hijos};});
console.log('contenedor transcripcion:', JSON.stringify(info,null,1));
const antes = await page.evaluate('window.__tutoria.media.currentTime()');
const hit = await page.evaluate(()=>{const el=Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0&&/ingreso mueve la l/i.test(e.textContent||'')); if(!el) return null; el.click(); return {tag:el.tagName,cls:el.className,txt:el.textContent.trim().slice(0,90),cursor:getComputedStyle(el).cursor};});
await page.waitForTimeout(700);
console.log('clic en linea:', JSON.stringify(hit));
console.log('  ct:', antes.toFixed(2), '->', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(2));
await page.screenshot({path:SC+'C-final.png', fullPage:true});
await browser.close();
