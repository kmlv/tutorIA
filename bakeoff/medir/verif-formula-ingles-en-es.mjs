import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';

async function run(lang, label){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(`http://localhost:57330/?lang=${lang}&t=170`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  // reproducir de verdad desde 170 y dejar que salte la prediccion price_effect (176.128)
  await page.evaluate(()=>{ window.__tutoria.media.seek(170); window.__tutoria.media.play(); });
  let seen=false;
  for(let i=0;i<40;i++){
    await page.waitForTimeout(500);
    const s = await page.evaluate(()=>{
      const q=document.querySelector('.q');
      const bands=document.querySelector('.bands');
      return {t:window.__tutoria.media.currentTime(), paused:window.__tutoria.media.paused(),
        q: q? q.innerText.replace(/\s+/g,' ').trim().slice(0,220):null,
        eq: bands? (bands.querySelector('.eq-slot')||{innerText:''}).innerText.replace(/\s+/g,' ').trim():''};
    });
    if(s.q && !seen){ seen=true;
      console.log(`\n[${label}] PREDICCION en pantalla t=${s.t.toFixed(2)} paused=${s.paused}`);
      console.log('   q:', s.q);
      console.log('   eq-slot:', s.eq);
      await page.screenshot({path:`${OUT}/${label}-prediccion.png`});
    }
    if(seen && s.q===null){ console.log(`[${label}] prediccion cerrada t=${s.t.toFixed(2)}`); break; }
    if(s.t>200) break;
  }
  // estado a 158 (durante income_shift) y al final
  for(const t of [158, 175.5, 178, 230]){
    await page.evaluate(s=>{window.__tutoria.media.pause(); window.__tutoria.media.seek(s);}, t);
    await page.waitForTimeout(700);
    const s = await page.evaluate(()=>{
      const bands=document.querySelector('.bands');
      const slot=bands&&bands.querySelector('.eq-slot');
      return {t:window.__tutoria.media.currentTime(),
        eq: slot? slot.innerText.replace(/\s+/g,' ').trim():'(sin eq-slot)',
        cap:(document.querySelector('.captions-band')||{innerText:''}).innerText.replace(/\s+/g,' ').trim().slice(0,160)};
    });
    console.log(`[${label}] t=${s.t.toFixed(1)}  eq="${s.eq}"  cap="${s.cap}"`);
  }
  await page.screenshot({path:`${OUT}/${label}-final.png`});
  await ctx.close();
}
await run('es','ES');
await run('en','EN');
await browser.close();
