import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const read = () => page.evaluate(() => {
  const enab = [...document.querySelectorAll('button')].filter(b=>!b.disabled && b.offsetParent!==null
      && !['play','ask'].includes(b.id) && !b.className.includes('caption-toggle') && !b.className.includes('composer-enviar'));
  const svg = document.querySelector('.lienzo svg');
  const textos = svg ? [...svg.querySelectorAll('text')].map(e=>({txt:e.textContent.trim(), x:+(e.getAttribute('x')||0)|0, y:+(e.getAttribute('y')||0)|0})).filter(o=>o.txt) : [];
  const trazos = svg ? [...svg.querySelectorAll('line,polyline,path')].map(e=>({cls:e.getAttribute('class'),
      x1:e.getAttribute('x1'),y1:e.getAttribute('y1'),x2:e.getAttribute('x2'),y2:e.getAttribute('y2'),
      d:(e.getAttribute('d')||'').slice(0,80), pts:(e.getAttribute('points')||'').slice(0,80),
      dash:e.getAttribute('stroke-dasharray')})) : [];
  const cards = [...document.querySelectorAll('.q')];
  const activa = cards.filter(c=>[...c.querySelectorAll('button')].some(b=>!b.disabled)).pop();
  return {
    t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
    estado: window.__tutoria.estado(),
    bands: document.querySelector('.bands')?.innerText.replace(/\s*\n+\s*/g,' ') || null,
    caps: (document.querySelector('.captions-band')?.innerText.replace(/\s*\n+\s*/g,' ')||'').replace('Ocultar subtítulos','').replace('Transcripción','').trim(),
    qtxt: activa?.querySelector('.q-enunciado')?.innerText.replace(/\n/g,' ') || null,
    botones: enab.map(b=>b.innerText.replace(/\n/g,' ').trim()),
    svgTxt: textos, trazos: trazos.filter(t=>t.x1||t.d||t.pts),
  };
});
const clic = (txt) => page.evaluate((txt) => {
  const b = [...document.querySelectorAll('button')].filter(b=>!b.disabled && b.offsetParent!==null)
      .find(b=>b.innerText.replace(/\n/g,' ').trim()===txt); b.click(); return true;
}, txt);
const P = (tag,s) => {
  console.log(`\n### ${tag}  t=${s.t.toFixed(2)} paused=${s.paused}`);
  console.log('  estado: p1=%s p2=%s m=%s fantasma=%s destacar=%s', s.estado.p1, s.estado.p2, s.estado.m, JSON.stringify(s.estado.fantasma), s.estado.destacar);
  console.log('  bands : ', s.bands);
  console.log('  caps  : ', s.caps.slice(0,300));
  console.log('  svgTxt: ', JSON.stringify(s.svgTxt.map(o=>o.txt)));
  if (s.qtxt) console.log('  Q: ', s.qtxt);
  console.log('  botones:', JSON.stringify(s.botones));
};
const respuestas = [
  [/gastan exactamente todo el ingreso/i],
  [/^3 litros$/i],
  [/desplaza hacia afuera, paralela/i],
];
let iResp = 0, prev='';
await page.click('#play'); console.log('>> Empezar (carga limpia, ?lang=es)');
const t0=Date.now();
while (Date.now()-t0 < 330000) {
  const s = await read();
  const k = `${s.estado.p1}/${s.estado.p2}/${s.estado.m}/${JSON.stringify(s.estado.fantasma)}`;
  if (k!==prev) { console.log(`[ESTADO] t=${s.t.toFixed(2)} -> ${k}`); prev=k; }
  if (s.paused && s.botones.length) {
    if (s.t >= 176) { P('*** price_effect — ANTES de responder ***', s); fs.writeFileSync('vf2-antes.json', JSON.stringify(s,null,1)); await page.screenshot({path:'vf2-antes.png'}); break; }
    if (s.botones.some(b=>/Listo, sigamos/i.test(b))) { console.log('  >> clic "Listo, sigamos"'); await clic(s.botones.find(b=>/Listo, sigamos/i.test(b))); await page.waitForTimeout(900); continue; }
    P('gate', s);
    let elegida = null;
    for (const pats of respuestas.slice(iResp)) { const m = s.botones.find(b=>pats.some(r=>r.test(b))); if (m) { elegida = m; break; } }
    if (!elegida) elegida = s.botones[0];
    console.log('  >> respondo:', elegida); await clic(elegida); iResp++;
    await page.waitForTimeout(1800);
    const f = await read(); console.log('  tras responder: t=%s paused=%s botones=%s', f.t.toFixed(2), f.paused, JSON.stringify(f.botones));
  }
  await page.waitForTimeout(600);
}
const s0 = await read();
const gira = s0.botones.find(b=>/gira/i.test(b)) ;
console.log('\n>>> PULSO:', gira);
await clic(gira);
await page.waitForTimeout(250); P('t+0.25s tras responder', await read()); await page.screenshot({path:'vf2-d025.png'});
await page.waitForTimeout(1000); P('t+1.2s tras responder', await read()); await page.screenshot({path:'vf2-d12.png'});
fs.writeFileSync('vf2-despues.json', JSON.stringify(await read(),null,1));
const vistos=new Set(); const tf=Date.now();
while (Date.now()-tf < 60000) {
  const s = await read();
  if (s.caps && !vistos.has(s.caps)) { vistos.add(s.caps); console.log(`  [cap t=${s.t.toFixed(1)}] ${s.caps.slice(0,240)}`); }
  const k = `${s.estado.p1}/${s.estado.p2}/${s.estado.m}/${JSON.stringify(s.estado.fantasma)}`;
  if (k!==prev) { console.log(`[ESTADO] t=${s.t.toFixed(2)} -> ${k}`); prev=k; }
  if (s.t > 188) { P('FIN t>188', s); break; }
  await page.waitForTimeout(500);
}
await page.screenshot({path:'vf2-188.png'});
await browser.close();
console.log('LISTO');
