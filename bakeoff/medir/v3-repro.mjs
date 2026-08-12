import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const net = [];
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
page.on('request', r => { const u=r.url(); if(u.includes('/api/')) net.push({m:r.method(), u:u.replace(/^.*\/api/,'/api').replace(/session\/[0-9a-f]+/,'session/SID'), body:r.postData()?.slice(0,400)}); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(`__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();`);
await page.waitForSelector('.q', {timeout:40000});
await page.waitForTimeout(1200);
await page.getByRole('button', {name:'Se vuelve más plana', exact:true}).first().click();
await page.waitForFunction(`document.querySelectorAll('.q-manip').length > 0`, null, {timeout:25000});
await page.waitForTimeout(1500);

const N = 12;
for (let i=1; i<=N; i++) {
  const antes = net.length;
  const dockAntes = await page.evaluate(`document.querySelector('.dock').innerText`);
  const ok = await page.evaluate(() => {
    const ms = [...document.querySelectorAll('.q-manip')];
    const last = ms[ms.length-1]; if(!last) return 'sin-manip';
    const b = [...last.querySelectorAll('button')].find(x=>/listo/i.test(x.textContent));
    if(!b) return 'sin-boton';
    if(b.disabled) return 'boton-DESHABILITADO';
    b.click(); return 'clic';
  });
  await page.waitForTimeout(2600);
  const dockDespues = await page.evaluate(`document.querySelector('.dock').innerText`);
  const nuevo = dockDespues.slice(dockAntes.length).trim().split('\n').map(s=>s.trim()).filter(Boolean);
  const st = await page.evaluate(() => ({nQ:document.querySelectorAll('.q').length, nManip:document.querySelectorAll('.q-manip').length}));
  console.log(`#${i} [${ok}] nQ=${st.nQ} nManip=${st.nManip}`);
  console.log('   TEXTO NUEVO EN EL DOCK:', JSON.stringify(nuevo));
  console.log('   RED:', JSON.stringify(net.slice(antes).map(x=>x.m+' '+x.u+(x.body?' '+x.body:''))));
  if(ok!=='clic') break;
}
await page.screenshot({path:'v3-final.png'});
const ans = net.filter(x=>x.u.includes('/answer'));
console.log(`TOTAL: /answer=${ans.length} /next=${net.filter(x=>x.u.includes('/next')).length} api=${net.length}`);
console.log('cuerpos /answer:', JSON.stringify(ans.map(x=>x.body)));
fs.writeFileSync('/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/v3-net.json', JSON.stringify(net,null,1));
fs.writeFileSync('/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/v3-dock.txt', await page.evaluate(`document.querySelector('.dock').innerText`));
await browser.close();
