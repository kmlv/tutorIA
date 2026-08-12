import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

async function corrida(lang) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(`http://localhost:57330/?lang=${lang}`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

  // todos los cues de nota, con su id
  const cues = await page.evaluate(`(() => {
    const s = window.__tutoriaSesion;
    return (s.media.cues||[]).map(c => ({t:c.t, tipo:c.tipo||c.type, id:c.id, nota:c.nota||c.note||null}));
  })()`);
  const interes = cues.filter(c => /shift|pivot|checkpoint|cp/i.test(JSON.stringify(c)));
  console.log(`\n===== lang=${lang} =====`);
  console.log('cues de interes:', JSON.stringify(interes));

  const marcas = [...new Set(cues.map(c=>c.t))].sort((a,b)=>a-b);
  const vistos = [];
  for (const t of marcas) {
    await page.evaluate(`window.__tutoria.media.seek(${t + 0.15})`);
    await page.waitForTimeout(140);
    const txt = await page.evaluate(`(() => {
      const el = document.querySelector('.bands'); return el ? el.innerText.replace(/\\s+/g,' ').trim() : '';
    })()`);
    if (/unchanged|slope|sin cambio|pendiente/i.test(txt)) vistos.push({t, txt});
  }
  console.log('bandas con palabras clave:');
  for (const v of vistos) console.log(`  t=${v.t.toFixed(2)}  ${v.txt}`);
  await ctx.close();
  return vistos;
}

const es = await corrida('es');
const en = await corrida('en');
console.log('\n===== comparacion =====');
for (const v of es) {
  const par = en.find(x => Math.abs(x.t - v.t) < 0.01);
  console.log(`t=${v.t.toFixed(2)}`);
  console.log(`   ES: ${v.txt}`);
  console.log(`   EN: ${par ? par.txt : '(sin par)'}`);
  console.log(`   identicas: ${par ? (par.txt === v.txt) : 'n/a'}`);
}
await browser.close();
