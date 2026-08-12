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
if (V==='A') { await page.evaluate('window.__tutoria.media.seek(142)'); await page.waitForTimeout(400); }
await page.evaluate('window.__tutoria.media.play()');
await page.waitForTimeout(6000);
const rd = async tag => console.log(tag, JSON.stringify(await page.evaluate(`(()=>{const v=document.querySelector('video');const q=[...document.querySelectorAll('.q')].pop();const l=document.querySelector('.lienzo');const lr=l.getBoundingClientRect();return{
 t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(), owns:window.__tutoria.media.ownsStage,
 video:v?getComputedStyle(v).display:null, lienzo:getComputedStyle(l).display, lienzoRect:{w:lr.width,h:lr.height},
 dock:window.__tutoria.dock.actual, nQ:document.querySelectorAll('.q').length,
 q:q?{enun:(q.querySelector('.q-enunciado')||{}).textContent, manip:!!q.querySelector('.q-manip'), ops:[...q.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim()), input:!!q.querySelector('input'), txt:q.innerText.replace(/\\n+/g,' / ').slice(0,220)}:null}})()`)));
await rd('cp1       ');
// answer WRONG
const qs = await page.$$('.q'); const last = qs[qs.length-1];
const bs = await last.$$('.q-opciones button');
console.log('  opciones:', await Promise.all(bs.map(b=>b.textContent())));
await bs[1].click();  // "Se vuelve más plana" = incorrecta
await page.waitForTimeout(4000);
await rd('tras fallo');
console.log('  DOCK:', (await page.evaluate(`document.querySelector('.dock').innerText`)).replace(/\n+/g,' | ').slice(-600));
await page.screenshot({path:SP+`/remedio-${V}.png`});
// keep going: answer whatever comes next
for (let i=0;i<3;i++){
  const qq = await page.$$('.q'); const l2 = qq[qq.length-1];
  const b2 = await l2.$$('.q-opciones button');
  const manip = await l2.$('.q-manip');
  if (manip) { console.log('  --> item de MANIPULACIÓN servido; lienzo:', await page.evaluate(`getComputedStyle(document.querySelector('.lienzo')).display`), ' video:', await page.evaluate(`(()=>{const v=document.querySelector('video');return v?getComputedStyle(v).display:null})()`)); await page.screenshot({path:SP+`/manip-${V}.png`}); break; }
  if (!b2.length) { console.log('  sin opciones que pulsar; html:', (await l2.evaluate(e=>e.outerHTML)).slice(0,400)); break; }
  await b2[0].click(); await page.waitForTimeout(3500); await rd('  paso '+i);
}
await page.screenshot({path:SP+`/remedio-fin-${V}.png`});
await browser.close();
