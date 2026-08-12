import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

const urls = [
 'http://localhost:57330/?lang=fr',
 'http://localhost:57330/?lang=ES',
 'http://localhost:57330/?lang=es',   // control
 'http://localhost:57330/',           // control sin lang
 'http://localhost:57330/?lang=',     // vacio
 'http://localhost:57330/?lang=es-MX',
];
for (const u of urls) {
  // CARGA LIMPIA: contexto nuevo por URL, sin cache/estado compartido
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const errs=[]; const cons=[];
  page.on('pageerror', e => errs.push(String(e).split('\n')[0].slice(0,220)));
  page.on('console', m => { if(m.type()==='error') cons.push(m.text().slice(0,200)); });
  const reqs=[];
  page.on('response', r => { if(r.url().includes('/api/')) reqs.push(r.status()+' '+r.url().replace('http://localhost:57330','')); });
  console.log('\n=== ', u);
  await page.goto(u,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => ({
    bodyText: document.body.innerText,
    bodyLen: document.body.innerText.length,
    appHTMLlen: (document.getElementById('app')||{innerHTML:''}).innerHTML.length,
    nBotones: document.querySelectorAll('button').length,
    nLinks: document.querySelectorAll('a').length,
    linkIdioma: (()=>{const a=document.querySelector('.idioma'); return a?{txt:a.textContent,href:a.getAttribute('href')}:null;})(),
    hook: !!window.__tutoria,
    dur: window.__tutoria ? +window.__tutoria.media.duration().toFixed(1) : null,
  }));
  console.log(' bodyLen=',info.bodyLen,' appHTMLlen=',info.appHTMLlen,' botones=',info.nBotones,' links=',info.nLinks,' hook=',info.hook,' dur=',info.dur);
  console.log(' bodyText=',JSON.stringify(info.bodyText.slice(0,200)));
  console.log(' linkIdioma=',JSON.stringify(info.linkIdioma));
  console.log(' pageerror=',JSON.stringify(errs));
  console.log(' console.error=',JSON.stringify(cons));
  console.log(' api=',JSON.stringify(reqs));
  await page.screenshot({path:SP+'/vlang-'+encodeURIComponent(u.split('localhost:57330')[1]||'root')+'.png'});
  await ctx.close();
}
await browser.close();
