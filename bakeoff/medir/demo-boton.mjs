import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const U='http://localhost:57330';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const fallos=[]; const ok=(c,m)=>{console.log(`  ${c?'✓':'✗'} ${m}`); if(!c)fallos.push(m);};

// SIN demo: el botón no existe.
{ const p=await (await browser.newContext()).newPage();
  await p.goto(`${U}/?lang=es`,{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria',null,{timeout:30000});
  ok(await p.evaluate('!document.getElementById("siguiente")'), 'sin ?demo=1 el botón NO existe');
  await p.context().close(); }

// CON demo: existe y salta de cue en cue.
{ const p=await (await browser.newContext()).newPage();
  await p.goto(`${U}/?lang=es&demo=1`,{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  ok(await p.evaluate('!!document.getElementById("siguiente")'), 'con ?demo=1 el botón aparece');
  const saltos=[];
  for (let i=0;i<5;i++){
    await p.evaluate('document.getElementById("siguiente").click()');
    await p.waitForTimeout(1200);
    saltos.push(await p.evaluate('+window.__tutoria.media.currentTime().toFixed(1)'));
    await p.evaluate('window.__tutoria.media.pause()');
  }
  console.log('    saltos:', saltos.join(' → '));
  ok(saltos.every((v,i)=>i===0||v>saltos[i-1]), 'cada salto avanza');
  const pintado=await p.evaluate(`document.querySelector('.lienzo svg')?.querySelectorAll('line,circle,polygon,text').length ?? 0`);
  ok(pintado>3, `y el gráfico pinta en el destino (${pintado} elementos)`);
  await p.context().close(); }

await browser.close();
console.log(`\n  ${fallos.length} fallo(s)`);
process.exit(fallos.length?1:0);
