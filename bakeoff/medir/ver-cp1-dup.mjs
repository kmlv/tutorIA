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
page.on('console', m => { if (m.type()==='error') console.log('  CONSOLE ERR:', m.text().slice(0,160)); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('CARGA LIMPIA OK. duracion =', await page.evaluate('window.__tutoria.media.duration()'));

// Cues de tipo checkpoint / pregunta
const cues = await page.evaluate(() => (window.__tutoriaSesion?.media?.cues||[]).map(c=>({t:c.t??c.tiempo??c.time, tipo:c.tipo??c.type, id:c.id})));
console.log('CUES cerca de 140-150:');
for (const c of cues) if (c.t>135 && c.t<155) console.log('   ', JSON.stringify(c));

const snap = async (tag) => {
  const s = await page.evaluate(() => {
    const qs = [...document.querySelectorAll('.q')];
    return {
      t: +window.__tutoria.media.currentTime().toFixed(2),
      paused: window.__tutoria.media.paused(),
      nQ: qs.length,
      cards: qs.map(q => ({
        enun: (q.querySelector('.q-enunciado')?.textContent||'').trim().slice(0,70),
        cls: q.className,
        opts: [...q.querySelectorAll('.q-opciones button')].map(b=>({
          txt:b.textContent.trim().slice(0,28), dis:b.disabled, cls:b.className,
          op: getComputedStyle(b).opacity
        })),
        opacity: getComputedStyle(q).opacity,
      })),
      totalBotones: document.querySelectorAll('.q-opciones button').length,
      disabled: [...document.querySelectorAll('.q-opciones button')].filter(b=>b.disabled).length,
      enabled: [...document.querySelectorAll('.q-opciones button')].filter(b=>!b.disabled).length,
      dockTexto: (document.querySelector('.dock')?.innerText||'').replace(/\s+/g,' ').trim().slice(0,400),
    };
  });
  console.log(`\n--- ${tag} --- t=${s.t} paused=${s.paused} .q=${s.nQ} botones=${s.totalBotones} (dis=${s.disabled}, en=${s.enabled})`);
  s.cards.forEach((c,i)=>{
    console.log(`   [card ${i}] op=${c.opacity} cls="${c.cls}" enun="${c.enun}"`);
    c.opts.forEach(o=>console.log(`        - "${o.txt}" dis=${o.dis} cls="${o.cls}" op=${o.op}`));
  });
  console.log('   DOCK:', s.dockTexto);
  return s;
};

// PASO 2
console.log('\n===== PASO 2: seek(143) + play()');
await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction(() => document.querySelectorAll('.q').length>0, null, {timeout:20000}).catch(()=>console.log('  (no aparecio .q)'));
await page.waitForTimeout(1200);
await snap('A: cp1 aparece por primera vez');
await page.screenshot({path:'v-A-cp1-primera.png'});

// PASO 3: contestar opcion 1
console.log('\n===== PASO 3: pulsar opcion 1');
await page.evaluate(() => { const b=document.querySelectorAll('.q-opciones button')[0]; b.click(); });
await page.waitForTimeout(1000);
await snap('B: tras contestar');
await page.screenshot({path:'v-B-contestada.png'});

// buscar 'Listo, sigamos'
const btns = await page.evaluate(() => [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean));
console.log('\n  BOTONES EN PAGINA:', JSON.stringify(btns));
const ok = await page.evaluate(() => {
  const b=[...document.querySelectorAll('button')].find(x=>/listo|sigamos|contin/i.test(x.textContent));
  if(!b) return null; b.click(); return b.textContent.trim();
});
console.log('  pulsado:', ok);
await page.waitForTimeout(1200);
await snap('C: tras Listo, sigamos');
await page.screenshot({path:'v-C-tras-listo.png'});

// PASO 4: rebobinar
console.log('\n===== PASO 4: seek(141) + play()');
await page.evaluate(() => { window.__tutoria.media.seek(141); window.__tutoria.media.play(); });
await page.waitForTimeout(800);
await snap('D: justo tras rebobinar a 141');

// PASO 5: esperar a cruzar 144.76
console.log('\n===== PASO 5: esperar a cruzar 144.76');
await page.waitForFunction(() => window.__tutoria.media.currentTime() > 145.6 || window.__tutoria.media.paused(), null, {timeout:25000}).catch(()=>console.log('  timeout esperando'));
await page.waitForTimeout(1500);
const s = await snap('E: tras recruzar 144.76');
await page.screenshot({path:'v-E-revisita.png', fullPage:true});

// texto visible completo del escenario/dock
const vis = await page.evaluate(() => (document.querySelector('.escenario')?.innerText||document.body.innerText).replace(/\n{2,}/g,'\n').trim());
console.log('\n===== TEXTO VISIBLE =====\n' + vis.slice(0,1800));

await browser.close();
