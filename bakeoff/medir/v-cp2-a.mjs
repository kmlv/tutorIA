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
  'Porque si gastas todo el ingreso en jugo no compras cafe, y el precio del jugo no cambio: m/p2 sigue igual',
  'El jugo cuesta menos que el cafe, por eso',
  'porque si',
  'asdf',
];

for (const txt of textos) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(193.5); window.__tutoria.media.play(); });

  // esperar textarea
  let ok = true;
  try {
    await page.waitForSelector('.q textarea', {timeout: 15000});
  } catch(e) { ok = false; }
  const t = await page.evaluate(()=>window.__tutoria.media.currentTime());
  console.log('\n=== TEXTO:', JSON.stringify(txt.slice(0,45)), '| textarea?', ok, '| t=', t.toFixed(2));
  if (!ok) { await ctx.close(); continue; }

  await page.evaluate(() => window.__tutoria.media.pause());

  const antes = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    const q = document.querySelector('.q');
    return {
      dockText: dock ? dock.innerText : null,
      qHTML: q ? q.outerHTML.slice(0,1500) : null,
      botones: [...document.querySelectorAll('.q button')].map(b=>({t:b.innerText, dis:b.disabled})),
      msgs: [...document.querySelectorAll('.dock .msg, .dock [class*=msg]')].map(m=>({c:m.className, t:m.innerText.slice(0,80)})),
    };
  });
  console.log('--- ANTES ---');
  console.log('dock:', JSON.stringify(antes.dockText));
  console.log('botones:', JSON.stringify(antes.botones));
  console.log('msgs:', JSON.stringify(antes.msgs));

  await page.fill('.q textarea', txt);
  const btn = await page.$('.q button');
  await page.evaluate((t) => {
    const b = [...document.querySelectorAll('.q button')].find(x=>/Responder|Enviar|Submit/i.test(x.innerText));
    if (b) b.click();
  });
  await page.waitForTimeout(2500);

  const despues = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    const q = document.querySelector('.q');
    const ta = document.querySelector('.q textarea');
    return {
      dockText: dock ? dock.innerText : null,
      qHTML: q ? q.outerHTML.slice(0,2000) : null,
      botones: [...document.querySelectorAll('.q button')].map(b=>({t:b.innerText, dis:b.disabled})),
      taValue: ta ? ta.value : null,
      taDisabled: ta ? ta.disabled : null,
      taReadOnly: ta ? ta.readOnly : null,
      msgs: [...document.querySelectorAll('.dock .msg, .dock [class*=msg]')].map(m=>({c:m.className, t:m.innerText.slice(0,120)})),
    };
  });
  console.log('--- DESPUES ---');
  console.log('dock:', JSON.stringify(despues.dockText));
  console.log('botones:', JSON.stringify(despues.botones));
  console.log('textarea value/dis/ro:', JSON.stringify(despues.taValue).slice(0,60), despues.taDisabled, despues.taReadOnly);
  console.log('msgs:', JSON.stringify(despues.msgs));
  console.log('qHTML:', despues.qHTML);
  await ctx.close();
}
await browser.close();
