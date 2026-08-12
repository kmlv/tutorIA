import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/shots';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for(const [tag,url] of [['pelado','http://localhost:57330/'],['variantB','http://localhost:57330/?lang=es&variant=B'],['t-raro','http://localhost:57330/?lang=es&t=9999'],['t-negativo','http://localhost:57330/?lang=es&t=-30'],['lang-raro','http://localhost:57330/?lang=fr']]){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const errs=[]; page.on('pageerror', e=>errs.push(String(e).slice(0,160)));
  try{
    await page.goto(url, {waitUntil:'domcontentloaded'});
    await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:15000});
    await page.waitForTimeout(700);
    const s = await page.evaluate(()=>({cur:+window.__tutoria.media.currentTime().toFixed(1), dur:+window.__tutoria.media.duration().toFixed(1),
      play:document.querySelector('#play')?.innerText, reloj:document.querySelector('.reloj')?.innerText,
      titulo:document.querySelector('h1,.titulo')?.innerText, cap:(document.querySelector('.captions-band')?.innerText||'').split('\n')[0],
      est:JSON.stringify(window.__tutoria.estado().mostrar)}));
    console.log(tag, url, JSON.stringify(s), 'errs=',JSON.stringify(errs));
    await page.screenshot({path:OUT+`/p12-${tag}.png`});
  }catch(e){ console.log(tag, url, 'FALLO AL CARGAR:', String(e).split('\n')[0], 'errs=',JSON.stringify(errs)); await page.screenshot({path:OUT+`/p12-${tag}.png`}); }
  await ctx.close();
}
await browser.close();
