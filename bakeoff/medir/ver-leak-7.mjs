import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

const cap = async (page) => page.evaluate(() => {
  const c = document.querySelector('.captions-band');
  return (c.innerText||'').replace(/\s+/g,' ').replace(/\s*(Ocultar|Mostrar|Hide|Show) (subtítulos|captions)\s*(Transcripción|Transcript)\s*$/i,'').trim();
});
const ultimaQ = async (page) => page.evaluate(() => {
  const qs=[...document.querySelectorAll('.q')]; const q=qs[qs.length-1]; if(!q) return null;
  return {n:qs.length, enunciado:(q.querySelector('.q-enunciado')?.innerText||'').replace(/\s+/g,' ').trim(),
          ops:[...q.querySelectorAll('.q-opciones button')].map(b=>b.innerText.replace(/\s+/g,' ').trim())};
});

// --- corrida limpia: SOLO prediccion 2 (pasos del informe, carga fresca) ---
{
  const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0', null, {timeout:30000});
  await page.evaluate('window.__tutoria.media.seek(121)');
  await page.click('#play');
  await page.waitForFunction('window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>122', null, {timeout:20000});
  await page.waitForTimeout(500);
  const q = await ultimaQ(page);
  console.log('=== PRED 2, CARGA LIMPIA (seek 121 -> Empezar) ===');
  console.log('  t=', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(3), '| tarjetas .q =', q.n);
  console.log('  PREGUNTA :', q.enunciado);
  q.ops.forEach((o,i)=>console.log('    ['+i+'] '+o));
  console.log('  SUBTITULO:', await cap(page));
  await page.screenshot({path: OUT+'/p2-limpia.png'});
  await page.close();
}

// --- semantica del borde: 87.00 / 87.04 / 87.045 / 87.05 ---
{
  const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0', null, {timeout:30000});
  console.log('\n=== SEMANTICA DEL BORDE (seek puro, sin reproducir) ===');
  for (const t of [86.5, 87.00, 87.04, 87.045, 87.05, 87.2]) {
    await page.evaluate(`window.__tutoria.media.seek(${t})`);
    await page.waitForTimeout(250);
    console.log('  seek('+t+') real='+(await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(3)+' -> '+(await cap(page)).slice(0,90));
  }
  await page.close();
}

// --- ingles ---
{
  const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
  await page.goto('http://localhost:57330/?lang=en', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0', null, {timeout:30000});
  const preds = await page.evaluate(()=> (window.__tutoriaSesion.media.cues||[]).filter(c=>(c.tipo||c.type)==='prediction').map(c=>c.t));
  console.log('\n=== INGLES ?lang=en, cues prediction en', JSON.stringify(preds), '===');
  await page.evaluate(`window.__tutoria.media.seek(${preds[0]-3})`);
  await page.click('#play');
  await page.waitForFunction(`window.__tutoria.media.paused() && window.__tutoria.media.currentTime()>${preds[0]-1}`, null, {timeout:20000});
  await page.waitForTimeout(500);
  const q = await ultimaQ(page);
  console.log('  t=', (await page.evaluate('window.__tutoria.media.currentTime()')).toFixed(3));
  console.log('  QUESTION:', q.enunciado);
  q.ops.forEach((o,i)=>console.log('    ['+i+'] '+o));
  console.log('  CAPTION :', await cap(page));
  await page.screenshot({path: OUT+'/en-p1.png'});
  await page.close();
}
await browser.close();
