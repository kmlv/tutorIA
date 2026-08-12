import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// Volcado de cues cerca del rango de interes
const cues = await page.evaluate(()=> (window.__tutoriaSesion?.media?.cues||[]).map(c=>({t:c.t ?? c.time ?? c.at, tipo:c.tipo||c.type||c.kind, id:c.id||c.nombre||c.name})));
console.log('CUES 185..245:');
for (const c of cues) if (c.t>=185 && c.t<=245) console.log('   ', JSON.stringify(c));

const snap = async () => await page.evaluate(()=>{
  const bands = document.querySelector('.bands');
  const txt = bands ? bands.innerText.replace(/\n+/g,' | ') : '(sin .bands)';
  return {t:+window.__tutoria.media.currentTime().toFixed(2), bands: txt};
});

console.log('\n--- REPRODUCCION LITERAL: seek(198) + play(), mirar cada 2s ---');
await page.evaluate(()=>{ window.__tutoria.media.seek(198); window.__tutoria.media.play(); });
for (let i=0;i<12;i++){
  await page.waitForTimeout(2000);
  const s = await snap();
  console.log(`t=${s.t}  ${s.bands}`);
}
await page.evaluate(()=> window.__tutoria.media.pause());
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-banda-tras222.png'});
await browser.close();
