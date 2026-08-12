import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/shots';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for(const [tag,url] of [['t100','http://localhost:57330/?lang=es&t=100'],['langEN','http://localhost:57330/?lang=EN'],['langesES','http://localhost:57330/?lang=es-ES'],['langpt','http://localhost:57330/?lang=pt']]){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const errs=[]; page.on('pageerror', e=>errs.push(String(e).slice(0,200)));
  const net=[]; page.on('response', r=>{ if(r.url().includes('/api/')) net.push(r.status()+' '+r.url().replace('http://localhost:57330','')); });
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(4000);
  const body = await page.evaluate(()=>document.body.innerText.replace(/\n/g,' | ').slice(0,220));
  const s = await page.evaluate(()=>{ try{ return {cur:+window.__tutoria.media.currentTime().toFixed(1), reloj:document.querySelector('.reloj')?.innerText, play:document.querySelector('#play')?.innerText, est:JSON.stringify(window.__tutoria.estado().mostrar)};}catch(e){return 'sin hooks: '+String(e).slice(0,80);} });
  console.log('---', tag, url);
  console.log('   estado:', JSON.stringify(s));
  console.log('   body  :', JSON.stringify(body));
  console.log('   api   :', JSON.stringify(net), 'errs:', JSON.stringify(errs));
  await page.screenshot({path:OUT+`/p13-${tag}.png`});
  await ctx.close();
}
await browser.close();
