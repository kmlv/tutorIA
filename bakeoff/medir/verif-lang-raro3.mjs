import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
for (const [u,name] of [['http://localhost:57330/?lang=ES','MAYUS-ES'],['http://localhost:57330/?lang=fr','FR'],['http://localhost:57330/?lang=es','CTRL-es-minuscula']]) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  await page.goto(u,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(3500);
  const len = await page.evaluate(()=>document.body.innerText.length);
  await page.screenshot({path:`${SP}/verif-lang-${name}.png`});
  console.log(name, u, 'bodyLen=', len);
  await ctx.close();
}
await browser.close();
