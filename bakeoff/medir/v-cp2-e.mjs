import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const textos = [
  ['BUENA','Porque si gastas todo el ingreso en jugo no compras cafe, y el precio del jugo no cambio: m/p2 sigue igual'],
  ['MEDIA','El jugo cuesta menos que el cafe, por eso'],
  ['POBRE','porque si'],
  ['BASURA','asdf'],
];
for (const [etiq,txt] of textos){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const cap=[];
  page.on('request', r=>{ if(/\/answer/.test(r.url())) cap.push('REQ '+r.postData()); });
  page.on('response', async r=>{ if(/\/answer/.test(r.url())){ let b=''; try{b=await r.text();}catch(e){} cap.push('RESP '+r.status()+' '+b); }});
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(193.5); window.__tutoria.media.play(); });
  await page.waitForSelector('.q textarea', {timeout: 15000});
  await page.evaluate(() => window.__tutoria.media.pause());
  await page.click('.q textarea'); await page.type('.q textarea', txt, {delay:1});
  await page.click('.q button'); await page.waitForTimeout(6000);
  console.log('\n===== '+etiq);
  for (const l of cap) console.log('  '+l.slice(0,900));
  await ctx.close();
}
await browser.close();
