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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const cnt = () => page.evaluate(() => ({
  q: document.querySelectorAll('.q').length,
  bt: document.querySelectorAll('.q-opciones button').length,
  dis: [...document.querySelectorAll('.q-opciones button')].filter(b=>b.disabled).length,
  t: +window.__tutoria.media.currentTime().toFixed(2),
  paused: window.__tutoria.media.paused(),
}));

async function ciclo(n){
  await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
  await page.waitForFunction(() => window.__tutoria.media.paused(), null, {timeout:20000}).catch(()=>{});
  await page.waitForTimeout(700);
  // contestar la ULTIMA tarjeta (la viva)
  await page.evaluate(() => {
    const qs=[...document.querySelectorAll('.q')]; const q=qs[qs.length-1];
    const b=[...q.querySelectorAll('.q-opciones button')].find(x=>!x.disabled); if(b) b.click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const b=[...document.querySelectorAll('button')].filter(x=>/listo, sigamos/i.test(x.textContent)).pop(); if(b) b.click(); });
  await page.waitForTimeout(900);
  console.log(`  vuelta ${n}:`, JSON.stringify(await cnt()));
}
console.log('=== ACUMULACION: cruzar cp1 varias veces contestando cada vez');
for (let i=1;i<=4;i++) await ciclo(i);

// estilos: la copia muerta vs la viva; y .elegida vs no elegida
const est = await page.evaluate(() => {
  const qs=[...document.querySelectorAll('.q')];
  const pick = el => { const s=getComputedStyle(el); return {op:s.opacity,bg:s.backgroundColor,bc:s.borderColor,bw:s.borderWidth,col:s.color,ol:s.outline,fw:s.fontWeight,bs:s.boxShadow,td:s.textDecorationLine}; };
  const card = q => ({ cls:q.className, id:q.id||null, box:pick(q),
    aria: q.getAttribute('aria-hidden'), inert: q.hasAttribute('inert'),
    opts:[...q.querySelectorAll('.q-opciones button')].map(b=>({txt:b.textContent.trim().slice(0,26), cls:b.className, dis:b.disabled, st:pick(b), aria:b.getAttribute('aria-disabled')})) });
  return { n: qs.length, primera: card(qs[0]), ultima: card(qs[qs.length-1]),
    idsDuplicados: (()=>{const m={};document.querySelectorAll('[id]').forEach(e=>m[e.id]=(m[e.id]||0)+1);return Object.entries(m).filter(([,v])=>v>1);})() };
});
console.log('\n=== ESTILOS ===');
console.log('n tarjetas:', est.n);
console.log('PRIMERA (muerta):', JSON.stringify(est.primera, null, 1));
console.log('ULTIMA (viva):', JSON.stringify(est.ultima.opts[0]), est.ultima.cls, JSON.stringify(est.ultima.box));
console.log('IDs duplicados:', JSON.stringify(est.idsDuplicados));

// geometria: se ven ambas a la vez?
const geo = await page.evaluate(() => {
  const dock=document.querySelector('.dock');
  const qs=[...document.querySelectorAll('.q')].map(q=>{const r=q.getBoundingClientRect();return {top:Math.round(r.top),bot:Math.round(r.bottom),h:Math.round(r.height)};});
  const dr=dock?dock.getBoundingClientRect():null;
  return {dock: dr?{top:Math.round(dr.top),bot:Math.round(dr.bottom),scrollTop:Math.round(dock.scrollTop),scrollH:Math.round(dock.scrollHeight),clientH:Math.round(dock.clientHeight)}:null, qs, vh: innerHeight};
});
console.log('\n=== GEOMETRIA ===', JSON.stringify(geo));
await page.screenshot({path:'v-4copias.png'});
await browser.close();
