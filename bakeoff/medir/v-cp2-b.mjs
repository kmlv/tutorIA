import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

const textos = [
  ['BUENA','Porque si gastas todo el ingreso en jugo no compras cafe, y el precio del jugo no cambio: m/p2 sigue igual'],
  ['MEDIA','El jugo cuesta menos que el cafe, por eso'],
  ['POBRE','porque si'],
  ['BASURA','asdf'],
];

for (const [etiq, txt] of textos) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  const posts = [];
  page.on('request', r => { if (r.method()!=='GET') posts.push({m:r.method(), u:r.url(), body:(r.postData()||'').slice(0,400)}); });
  page.on('response', async r => {
    if (r.request().method()!=='GET') {
      let b=''; try { b = (await r.text()).slice(0,600); } catch(e){}
      posts.push({RESP:r.status(), u:r.url(), body:b});
    }
  });
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(193.5); window.__tutoria.media.play(); });
  await page.waitForSelector('.q textarea', {timeout: 15000});
  await page.evaluate(() => window.__tutoria.media.pause());
  console.log('\n======== ', etiq, ' t=', (await page.evaluate(()=>window.__tutoria.media.currentTime())).toFixed(2));

  await page.click('.q textarea');
  await page.type('.q textarea', txt, {delay: 2});
  const val = await page.$eval('.q textarea', e=>e.value);
  console.log('textarea antes de enviar:', JSON.stringify(val.slice(0,50)), 'len', val.length);
  await page.click('.q button');

  // muestrear el dock durante 30 s
  let prev = '';
  for (let i=0;i<12;i++){
    await page.waitForTimeout(1000);
    const now = await page.evaluate(()=>document.querySelector('.dock').innerText);
    if (now !== prev) { console.log(`  [t+${i+1}s] dock -> ${JSON.stringify(now)}`); prev = now; }
  }
  const fin = await page.evaluate(() => {
    const ta=document.querySelector('.q textarea');
    return {
      msgs:[...document.querySelectorAll('.dock .msg')].map(m=>({c:m.className,t:m.innerText.slice(0,200)})),
      ta: ta?{v:ta.value.slice(0,40),dis:ta.disabled}:null,
      btn:[...document.querySelectorAll('.q button')].map(b=>({t:b.innerText,dis:b.disabled})),
      dockActual: window.__tutoria.dock ? JSON.stringify(window.__tutoria.dock.actual).slice(0,400) : null,
    };
  });
  console.log('FINAL msgs:', JSON.stringify(fin.msgs));
  console.log('FINAL ta:', JSON.stringify(fin.ta), 'btn:', JSON.stringify(fin.btn));
  console.log('dock.actual:', fin.dockActual);
  console.log('RED no-GET:', JSON.stringify(posts, null, 1).slice(0,1500));
  await ctx.close();
}
await browser.close();
