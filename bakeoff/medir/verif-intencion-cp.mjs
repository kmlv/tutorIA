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
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const api = [];
page.on('request', r => { const u=r.url(); if (u.includes('/api/')) api.push(r.method()+' '+u.split('/api/')[1]); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const cues = await page.evaluate('window.__tutoriaSesion.media.cues.map(c=>[c.id,c.t,c.type])');
console.log('cues especiales:', JSON.stringify(cues.filter(c=>c[2]!=='beat'&&c[2]!=='reveal')));
const cp = cues.find(c=>c[2]==='checkpoint');
console.log('primer checkpoint:', JSON.stringify(cp));
// arrancar y dejar correr hasta que salte el checkpoint
await page.evaluate(`window.__tutoria.media.seek(${Math.max(0, cp[1]-3)})`);
await page.evaluate('window.__tutoria.media.play()');
await page.waitForFunction('window.__tutoria.dock.actual === "abierto-activo"', null, {timeout:40000}).catch(()=>console.log('  (no llego a abierto-activo)'));
await page.waitForTimeout(1200);
console.log('en checkpoint: dock =', await page.evaluate('window.__tutoria.dock.actual'),
            ' paused =', await page.evaluate('window.__tutoria.media.paused()'),
            ' t =', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(1));
console.log('DOM pregunta:', JSON.stringify((await page.$$eval('.dock-body .pregunta, .dock-body .msg', ns=>ns.map(n=>n.className+'|'+(n.textContent||'').slice(0,90)))).slice(-3)));
const opts = await page.$$eval('.q-opciones button', bs=>bs.map(b=>b.textContent));
console.log('opciones:', JSON.stringify(opts));
// el alumno pulsa "No entiendo" en vez de responder
const n0 = api.length;
await page.click('.dock-acciones button:text-is("No entiendo")');
await page.waitForTimeout(6000);
console.log('\ntras "No entiendo" en el checkpoint:');
console.log('  API:', JSON.stringify(api.slice(n0)));
console.log('  dock =', await page.evaluate('window.__tutoria.dock.actual'),
            ' paused =', await page.evaluate('window.__tutoria.media.paused()'));
console.log('  historial:', JSON.stringify((await page.$$eval('.dock-body > *', ns=>ns.map(n=>n.className+'|'+(n.textContent||'').slice(0,80)))).slice(-4)));
console.log('  ¿siguen las opciones?', (await page.$$('.q-opciones button')).length);
// y ahora ¿responde todavía la pregunta?
if ((await page.$$('.q-opciones button')).length) {
  const n1 = api.length;
  await page.click('.q-opciones button >> nth=0');
  await page.waitForTimeout(3000);
  console.log('  tras responder la opcion 0: API', JSON.stringify(api.slice(n1)));
  console.log('  dock =', await page.evaluate('window.__tutoria.dock.actual'), ' paused =', await page.evaluate('window.__tutoria.media.paused()'));
}
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cp-intencion.png'});
await browser.close();
