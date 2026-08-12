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
  ['VACIO',''],
];
for (const [etiq, txt] of textos) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  const ev = [];
  page.on('request', r => { if (r.method()==='POST' && /\/events/.test(r.url())) ev.push(r.postData()); });
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(193.5); window.__tutoria.media.play(); });
  await page.waitForSelector('.q textarea', {timeout: 15000});
  await page.evaluate(() => window.__tutoria.media.pause());
  console.log('\n======== ', etiq);
  const n0 = ev.length;
  if (txt) { await page.click('.q textarea'); await page.type('.q textarea', txt, {delay:1}); }
  console.log('ta antes:', JSON.stringify(await page.$eval('.q textarea', e=>e.value).then(v=>v.slice(0,50))));
  await page.click('.q button');
  let prev = await page.evaluate(()=>document.querySelector('.dock').innerText);
  for (let i=0;i<10;i++){
    await page.waitForTimeout(700);
    const now = await page.evaluate(()=>document.querySelector('.dock').innerText);
    if (now !== prev) { console.log(`  [+${((i+1)*0.7).toFixed(1)}s] CAMBIA -> ${JSON.stringify(now.replace(/\n+/g,' | '))}`); prev = now; }
  }
  const fin = await page.evaluate(() => {
    const ta=document.querySelector('.q textarea');
    return {msgs:[...document.querySelectorAll('.dock .msg')].map(m=>m.className+' :: '+m.innerText.slice(0,200)),
      ta: ta?{v:ta.value.slice(0,30),dis:ta.disabled}:null,
      btn:[...document.querySelectorAll('.q button')].map(b=>b.innerText+' dis='+b.disabled),
      qcls: document.querySelector('.q')?document.querySelector('.q').className:null};
  });
  console.log('msgs:', JSON.stringify(fin.msgs));
  console.log('ta:', JSON.stringify(fin.ta), 'btn:', JSON.stringify(fin.btn), 'q.class:', fin.qcls);
  console.log('EVENTOS tras enviar:', JSON.stringify(ev.slice(n0)));
  await ctx.close();
}
await browser.close();
