import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
for (const [V,t] of [['B',110],['A',110]]) {
  await page.goto(`http://localhost:57330/?lang=es&variant=${V}&t=${t}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.waitForTimeout(2500);
  console.log(V, JSON.stringify(await page.evaluate(`(()=>{const a=document.querySelector('.idioma');const cs=getComputedStyle(a);const r=a.getBoundingClientRect();
    const lag=[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&/p\\d\\d\\s*\\d+ms/.test(e.textContent)).map(e=>({cls:e.className,txt:e.textContent}));
    return {idioma:{txt:a.textContent,color:cs.color,bg:cs.backgroundColor,op:cs.opacity,pe:cs.pointerEvents,rect:{w:r.width,h:r.height}}, lag, caption:(document.querySelector('.captions-band')||{}).innerText};})()`)));
  await page.screenshot({path:SP+`/vista-${V}.png`});
}
await browser.close();
