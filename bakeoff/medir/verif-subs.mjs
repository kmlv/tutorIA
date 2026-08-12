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
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

// 1. Volcar los cues de tipo pregunta y los segmentos de subtitulo
const info = await page.evaluate(() => {
  const s = window.__tutoriaSesion;
  const media = s.media || {};
  const cues = (media.cues||[]).map(c => ({t: c.t ?? c.tiempo ?? c.time, tipo: c.tipo ?? c.type, id: c.id, keys: Object.keys(c)}));
  return {
    duration: window.__tutoria.media.duration(),
    cueSample: cues.slice(0,5),
    cuesPregunta: cues.filter(c => JSON.stringify(c).toLowerCase().includes('pregunta') || JSON.stringify(c).toLowerCase().includes('quest')),
    mediaKeys: Object.keys(media),
  };
});
console.log(JSON.stringify(info, null, 2).slice(0, 4000));
fs.writeFileSync('/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/info1.json', JSON.stringify(info,null,2));
await browser.close();
