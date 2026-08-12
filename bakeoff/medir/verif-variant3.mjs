import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

async function run(url, label){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const errs=[]; page.on('pageerror', e=>errs.push(String(e).slice(0,160)));
  await page.goto(url,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(3500);
  console.log('\n### '+label+'  '+url);
  const inv = async t => console.log(' ', t, JSON.stringify(await page.evaluate(()=>({
    hook: typeof window.__tutoria!=='undefined',
    reloj:(document.body.innerText.match(/\d+:\d\d/g)||[])[0],
    dock: document.querySelector('.dock')?.innerText.slice(0,90).replace(/\n+/g,' | '),
    qs: document.querySelectorAll('.q').length,
  }))));
  await inv('inicio');
  // composer forzado
  await page.click('.composer-input',{force:true}).catch(e=>console.log('  composer no clicable:',String(e).slice(0,60)));
  await page.evaluate(()=>document.querySelector('.composer-input')?.focus());
  await page.keyboard.type('que es la pendiente?');
  const val = await page.evaluate(()=>document.querySelector('.composer-input')?.value ?? document.querySelector('.composer-input')?.innerText);
  console.log('  texto en composer:', JSON.stringify(val));
  await page.click('.composer-enviar',{force:true}).catch(e=>console.log('  enviar no clicable:',String(e).slice(0,60)));
  await page.waitForTimeout(6000);
  await inv('tras enviar');
  console.log('  dock completo:', JSON.stringify((await page.evaluate(()=>document.querySelector('.dock')?.innerText)||'').slice(0,300)));
  // toggle idioma por JS
  await page.evaluate(()=>{ for(const b of document.querySelectorAll('button')) if(/English|Espa/.test(b.textContent)) { b.click(); return; } });
  await page.waitForTimeout(4000);
  await inv('tras idioma');
  console.log('  url ahora:', await page.evaluate(()=>location.href));
  console.log('  errores:', errs);
  await page.screenshot({path:'v3-'+label+'.png'});
  await ctx.close();
}
await run('http://localhost:57330/?lang=es&variant=b','b-min');
await run('http://localhost:57330/?lang=es&variant=B','B-ok');
await browser.close();
