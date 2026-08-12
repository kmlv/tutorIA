import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('cargado. duracion=', await page.evaluate('window.__tutoria.media.duration()'));

// 1) inventario de cues: tipo prediction y sus tiempos
const cues = await page.evaluate(() => (window.__tutoriaSesion?.media?.cues||[]).map(c=>({t:c.t ?? c.time ?? c.at, tipo:c.tipo||c.type||c.kind, ...(c)})));
const preds = cues.filter(c=>JSON.stringify(c).includes('predic'));
console.log('total cues', cues.length, '| cues con "predic":', preds.length);
for (const p of preds) console.log('   PRED', JSON.stringify(p).slice(0,300));

// 2) segmentos de subtitulos disponibles?
const seg = await page.evaluate(() => {
  const s = window.__tutoriaSesion?.media||{};
  return Object.keys(s);
});
console.log('media keys:', seg);
fs.writeFileSync(OUT+'/cues.json', JSON.stringify(cues,null,1));
await browser.close();
