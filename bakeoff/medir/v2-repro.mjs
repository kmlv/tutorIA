import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
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

const snap = async () => await page.evaluate(() => ({
  q: document.querySelector('.q-enunciado')?.textContent?.trim(),
  ops: [...document.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim()),
  manip: !!document.querySelector('.q-manip'),
  manipBtns: [...document.querySelectorAll('.q-manip button')].map(b=>b.textContent.trim()),
  dockTail: document.querySelector('.dock')?.innerText?.trim().split('\n').filter(Boolean).slice(-14).join(' | '),
  nQ: document.querySelectorAll('.q').length,
}));

console.log('--- ANTES de responder ---'); console.log(JSON.stringify(await snap(),null,1));
// responder MAL
await page.getByRole('button', {name:'Se vuelve más plana', exact:true}).first().click();
await page.waitForTimeout(2500);
console.log('--- TRAS respuesta MAL ---'); console.log(JSON.stringify(await snap(),null,1));

// esperar a la pregunta de manipulacion
try {
  await page.waitForFunction(`document.querySelectorAll('.q-manip').length > 0`, null, {timeout:25000});
} catch(e) { console.log('!! no aparecio .q-manip en 25s'); }
await page.waitForTimeout(1200);
console.log('--- ESTADO con manip ---'); console.log(JSON.stringify(await snap(),null,1));
await page.screenshot({path:'v2-manip.png', fullPage:false});

// contador de red antes de pulsar Listo
const marca0 = net.length;
for (let i=1; i<=5; i++) {
  const btns = await page.$$('.q-manip button');
  if (!btns.length) { console.log(`iter ${i}: NO hay botones .q-manip`); break; }
  const labels = await Promise.all(btns.map(b=>b.textContent()));
  const idx = labels.findIndex(t=>/listo/i.test(t.trim()));
  if (idx < 0) { console.log('iter '+i+': no hay boton Listo, hay:', labels); break; }
  await btns[idx].click();
  await page.waitForTimeout(2500);
  const s = await snap();
  console.log(`--- tras clic Listo #${i} --- nQ=${s.nQ} manip=${s.manip} q="${s.q}"`);
  console.log('   dock:', s.dockTail);
  console.log('   net desde marca:', JSON.stringify(net.slice(marca0).map(x=>x.m+' '+x.u+' '+(x.body||''))));
}
await page.screenshot({path:'v2-tras5.png'});
fs.writeFileSync('/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/v2-net.json', JSON.stringify(net,null,1));
const ans = net.filter(x=>x.u.includes('/answer')).length;
const nxt = net.filter(x=>x.u.includes('/next')).length;
console.log(`TOTAL: /answer=${ans}  /next=${nxt}  total api=${net.length}`);
await browser.close();
