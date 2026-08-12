import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
export async function abrir(opts={}){
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
  const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
  const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });
  const red = [];
  page.on('request', r => { if (r.url().includes('/api/')) red.push({m:r.method(), u:r.url().replace(/^.*\/api/,'/api'), body:r.postData()}); });
  page.on('response', async r => { if (r.url().includes('/answer')||r.url().includes('/next')) {
      try { const t = await r.text(); red.push({resp:r.url().replace(/^.*\/api/,'/api'), status:r.status(), t:t.slice(0,300)}); } catch {}
  }});
  await page.goto('http://localhost:57330/?lang='+(opts.lang||'es'), {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return {browser, page, red};
}
export async function qInfo(page){
  return await page.evaluate(() => {
    const q = document.querySelector('.dock .pregunta:last-child .q');
    return q ? {cls:q.className, enun:(q.querySelector('.q-enunciado')||{}).textContent,
      nota:(q.querySelector('.q-nota')||{}).textContent,
      btns:[...q.querySelectorAll('button')].map(b=>b.textContent+(b.disabled?' [DIS]':''))} : null;
  });
}
export async function hastaManip(page, max=14){
  await page.evaluate('window.__tutoria.practice.start(); 1');
  for (let i=0;i<max;i++){
    await page.waitForTimeout(500);
    const s = await qInfo(page);
    if (!s) { await page.waitForTimeout(500); continue; }
    if (s.cls.includes('q-manip')) return s;
    const sel = '.dock .pregunta:last-child ';
    if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button');
    else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input','1'); await page.click(sel+'button[type=submit]'); }
    else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','no se'); await page.click(sel+'button[type=submit]'); }
  }
  return null;
}
export async function msgs(page){
  return await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.className.replace('msg ','')+': '+m.textContent));
}
