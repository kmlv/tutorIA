import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/shots';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for(const [tag,w,h] of [['movil',390,844],['portatil',1024,700]]){
  const ctx = await browser.newContext({viewport:{width:w,height:h}});
  const page = await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,150)));
  await page.goto('http://localhost:57330/?lang=es&t=0',{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0');
  await page.click('#play');
  await page.evaluate(()=>window.__tutoria.media.seek(150)); await page.waitForTimeout(2500);
  const ov = await page.evaluate(()=>{
    const b=document.body; const cortes=[];
    for(const el of document.querySelectorAll('.lienzo,.bands,.dock,.captions-band,.controles,.q')){
      const r=el.getBoundingClientRect();
      if(r.width && (r.right>innerWidth+1 || r.bottom>innerHeight+1 || r.left<-1)) cortes.push(el.className+' '+[r.x|0,r.y|0,r.width|0,r.height|0].join(','));
    }
    return {cortes, scrollX: document.documentElement.scrollWidth>innerWidth, sw:document.documentElement.scrollWidth, iw:innerWidth};});
  console.log(tag,w+'x'+h, JSON.stringify(ov), 'errs',JSON.stringify(errs));
  await page.screenshot({path:OUT+`/p17-${tag}.png`, fullPage:false});
  await ctx.close();
}
await browser.close();
