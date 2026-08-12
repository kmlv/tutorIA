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
const reqs = [];
page.on('request', r => reqs.push({t: Date.now(), m: r.method(), u: r.url()}));
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,200)); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('duracion', await page.evaluate('window.__tutoria.media.duration()'));

// cues around 87
const cues = await page.evaluate('window.__tutoriaSesion.media.cues');
console.log('cues cerca de 87:', JSON.stringify(cues.filter(c=>c.t!==null && c.t>75 && c.t<95)));

// seek to just before the prediction and play
await page.evaluate('window.__tutoria.media.seek(84); window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:30000});
const clock = await page.evaluate('document.getElementById("reloj").textContent');
const tnow  = await page.evaluate('window.__tutoria.media.currentTime()');
console.log('pregunta en pantalla. reloj=', clock, ' t=', tnow, ' paused=', await page.evaluate('window.__tutoria.media.paused()'));
console.log('dock estado=', await page.evaluate('window.__tutoria.dock.actual'));
console.log('enunciado:', (await page.textContent('.q-enunciado'))?.trim().slice(0,200));
const opts = await page.$$eval('.q-opciones button', bs => bs.map(b=>b.textContent.trim()));
console.log('opciones:', JSON.stringify(opts));
const chips = await page.$$eval('.dock-acciones button', bs => bs.map(b=>b.textContent.trim()));
console.log('chips:', JSON.stringify(chips));

const dump = async (label) => {
  const msgs = await page.$$eval('.dock-body .msg', ps => ps.map(p=>p.className+' :: '+p.textContent.trim()));
  console.log(`--- historial tras ${label} (${msgs.length} msgs) ---`);
  msgs.forEach(m=>console.log('   ', m.slice(0,160)));
};

for (const label of ['No entiendo','Otro ejemplo','Más despacio','¿Por qué?']) {
  const before = reqs.length;
  await page.click(`.dock-acciones button:text-is("${label}")`);
  await page.waitForTimeout(15000);
  const nuevos = reqs.slice(before).map(r=>r.m+' '+r.u.replace('http://localhost:57330',''));
  console.log(`\n=== CHIP "${label}" -> peticiones en 15s: ${JSON.stringify(nuevos)}`);
  await dump(label);
}
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-chips-1.png'});
await browser.close();
