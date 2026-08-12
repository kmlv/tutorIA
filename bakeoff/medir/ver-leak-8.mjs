import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const capOf = async (p) => p.evaluate(() => (document.querySelector('.captions-band').innerText||'')
  .replace(/\s+/g,' ').replace(/\s*(Ocultar|Mostrar|Hide|Show) (subtítulos|captions)\s*(Transcripción|Transcript)\s*$/i,'').trim());
const qOf = async (p) => p.evaluate(() => { const qs=[...document.querySelectorAll('.q')]; const q=qs[qs.length-1]; if(!q)return null;
  return {e:(q.querySelector('.q-enunciado')?.innerText||'').replace(/\s+/g,' ').trim(),
          o:[...q.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\s+/g,' ').trim())};});

// PERSISTENCIA: el subtitulo sigue impreso mientras el alumno delibera?
{
  const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.evaluate('window.__tutoria.media.seek(84)'); await page.click('#play');
  await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>85',null,{timeout:20000});
  console.log('=== PERSISTENCIA del subtitulo con el reproductor en pausa ===');
  for (const s of [0,3,10,20]) { if(s) await page.waitForTimeout(s*1000 - (s===3?0:(s===10?3000:10000)));
    console.log('  +'+s+'s | pausado='+(await page.evaluate('window.__tutoria.media.paused()'))+' | '+(await capOf(page)).slice(0,80)); }
  await page.close();
}
// INGLES preds 2 y 3
{
  const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
  await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  const preds = await page.evaluate(()=> (window.__tutoriaSesion.media.cues||[]).filter(c=>(c.tipo||c.type)==='prediction').map(c=>c.t));
  console.log('\n=== INGLES: las tres predicciones ===');
  for (const t of preds) {
    await page.evaluate(`window.__tutoria.media.seek(${t-3})`); await page.waitForTimeout(200);
    await page.click('#play');
    await page.waitForFunction(`window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>${t-1}`,null,{timeout:20000});
    await page.waitForTimeout(400);
    const q = await qOf(page);
    console.log('\n  -- cue t='+t+' (real '+(await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(3)+')');
    console.log('     Q: '+q.e);
    q.o.forEach((o,i)=>console.log('       ['+i+'] '+o));
    console.log('     CAPTION: '+await capOf(page));
  }
  await page.close();
}
await browser.close();
