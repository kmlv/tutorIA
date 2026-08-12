import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const V=process.argv[2]||'B';
await page.goto(`http://localhost:57330/?lang=es&variant=${V}&t=142`,{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
if (V==='A'){await page.evaluate('window.__tutoria.media.seek(142)');await page.waitForTimeout(400);}
await page.evaluate('window.__tutoria.media.play()'); await page.waitForTimeout(6000);
const qs = await page.$$('.q'); const bs = await qs[qs.length-1].$$('.q-opciones button');
await bs[1].click(); await page.waitForTimeout(4000);
const rd = async tag => console.log(tag, JSON.stringify(await page.evaluate(`(()=>{const ci=document.querySelector('.composer-input');const ce=document.querySelector('.composer-enviar');const r=ci?ci.getBoundingClientRect():null;return{
 t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(), dock:window.__tutoria.dock.actual,
 nQ:document.querySelectorAll('.q').length, habilitadas:[...document.querySelectorAll('.q-opciones button')].filter(b=>!b.disabled).length,
 composer: ci? {tag:ci.tagName, disabled:ci.disabled, rect:{w:r.width,h:r.height,top:r.top}, ph:ci.placeholder}:null,
 enviar: ce? {disabled:ce.disabled, txt:ce.textContent}:null,
 pie:[...document.querySelectorAll('.dock button')].map(b=>b.textContent.trim()).filter(Boolean)}})()`)));
await rd('tras fallo');
await page.screenshot({path:SP+`/socratico-${V}.png`});
// intentar responder por el composer
const ci = await page.$('.composer-input');
if (ci) {
  await page.evaluate(`(()=>{const i=document.querySelector('.composer-input'); i.scrollIntoView(); i.focus(); })()`);
  await page.keyboard.type('No, no cambió');
  const send = await page.$('.composer-enviar');
  if (send) await page.evaluate(`document.querySelector('.composer-enviar').click()`);
  await page.waitForTimeout(6000);
  await rd('tras texto');
  console.log('  DOCK:', (await page.evaluate(`document.querySelector('.dock').innerText`)).replace(/\n+/g,' | ').slice(-500));
}
await page.screenshot({path:SP+`/socratico2-${V}.png`});
// pulsar "Listo, sigamos"
const listo = await page.evaluateHandle(`[...document.querySelectorAll('.dock button')].find(b=>/Listo|Done|sigamos/i.test(b.textContent))`);
const el = listo.asElement();
if (el) { await el.click(); await page.waitForTimeout(3000); await rd('tras Listo'); }
else console.log('  no hay boton Listo');
console.log('  DOCK final:', (await page.evaluate(`document.querySelector('.dock').innerText`)).replace(/\n+/g,' | ').slice(-400));
await page.screenshot({path:SP+`/socratico3-${V}.png`});
await browser.close();
