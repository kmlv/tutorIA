import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const vp of [{width:1280,height:860},{width:1024,height:768},{width:820,height:1024}]) {
  const ctx = await browser.newContext({viewport:vp});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,160)));
  await page.goto('http://localhost:57330/?lang=es&variant=B&t=110',{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.waitForTimeout(2500);
  console.log(vp.width+'x'+vp.height, JSON.stringify(await page.evaluate(`(()=>{const v=document.querySelector('video');const e=document.querySelector('.escenario');
    const vr=v.getBoundingClientRect(), er=e.getBoundingClientRect(); const cs=getComputedStyle(v);
    return {video:{x:+vr.x.toFixed(0),y:+vr.y.toFixed(0),w:+vr.width.toFixed(0),h:+vr.height.toFixed(0)}, natural:{w:v.videoWidth,h:v.videoHeight},
      escenario:{x:+er.x.toFixed(0),y:+er.y.toFixed(0),w:+er.width.toFixed(0),h:+er.height.toFixed(0)}, objectFit:cs.objectFit, w:cs.width, h:cs.height};})()`)));
  await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/B-'+vp.width+'.png'});
  await ctx.close();
}
await browser.close();
