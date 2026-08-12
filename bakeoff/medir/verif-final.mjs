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
  const cards = [...document.querySelectorAll('.q')];
  const activa = cards.filter(c => [...c.querySelectorAll('button')].some(b=>!b.disabled)).pop() || null;
  const svg = document.querySelector('.lienzo svg') || document.querySelector('.lienzo');
  const lineas = svg ? [...svg.querySelectorAll('line,polyline,path')].map(e=>({
      tag:e.tagName, cls:e.getAttribute('class'), d:(e.getAttribute('d')||'').slice(0,90),
      pts:(e.getAttribute('points')||'').slice(0,90),
      x1:e.getAttribute('x1'),y1:e.getAttribute('y1'),x2:e.getAttribute('x2'),y2:e.getAttribute('y2'),
      dash:e.getAttribute('stroke-dasharray')})).filter(e=>e.d||e.pts||e.x1) : [];
  const textos = svg ? [...svg.querySelectorAll('text')].map(e=>e.textContent.trim()).filter(Boolean) : [];
  return {
    t: window.__tutoria.media.currentTime(), paused: window.__tutoria.media.paused(),
    estado: window.__tutoria.estado(),
    bands: document.querySelector('.bands')?.innerText.replace(/\s*\n+\s*/g,' ') || null,
    caps: document.querySelector('.captions-band')?.innerText.replace(/\s*\n+\s*/g,' ').replace('Ocultar subtítulos Transcripción','') || null,
    qtxt: activa ? activa.querySelector('.q-enunciado')?.innerText.replace(/\n/g,' ') : null,
    ops: activa ? [...activa.querySelectorAll('button')].filter(b=>!b.disabled).map(b=>b.innerText.replace(/\n/g,' ')) : [],
    hayActiva: !!activa,
    svgTextos: textos, svgLineas: lineas,
  };
});
const clickOp = (txt) => page.evaluate((txt) => {
  const cards = [...document.querySelectorAll('.q')];
  const activa = cards.filter(c => [...c.querySelectorAll('button')].some(b=>!b.disabled)).pop();
  const bs = [...activa.querySelectorAll('button')].filter(b=>!b.disabled);
  const b = bs.find(b => b.innerText.replace(/\n/g,' ') === txt); b.click(); return b.innerText;
}, txt);
const P = (tag,s) => {
  console.log(`\n### ${tag}  t=${s.t.toFixed(2)} paused=${s.paused}`);
  console.log('  estado:', JSON.stringify(s.estado));
  console.log('  bands :', s.bands);
  console.log('  caps  :', (s.caps||'').trim().slice(0,260));
  console.log('  svgTxt:', JSON.stringify(s.svgTextos));
  if (s.qtxt) console.log('  Q:', s.qtxt, '\n  ops:', JSON.stringify(s.ops));
};

await page.click('#play');
console.log('>> Empezar');
let ultimo='';
while (true) {
  const s = await read();
  const k = JSON.stringify([s.estado.p1,s.estado.p2,s.estado.m,s.estado.fantasma]);
  if (k!==ultimo) { console.log(`\n[cambio de estado] t=${s.t.toFixed(2)} -> p1=${s.estado.p1} p2=${s.estado.p2} m=${s.estado.m} fantasma=${JSON.stringify(s.estado.fantasma)}`); ultimo=k; }
  if (s.paused && s.hayActiva) {
    if (s.t >= 176) { P('*** PREGUNTA price_effect — ANTES DE RESPONDER ***', s);
      await page.screenshot({path:'vf-antes.png'});
      fs.writeFileSync('vf-antes.json', JSON.stringify(s,null,1));
      break; }
    P('gate', s);
    const buena = s.ops.find(o=>/gastan exactamente todo el ingreso/i.test(o))
      || s.ops.find(o=>/desplaza hacia afuera, paralela/i.test(o))
      || s.ops.find(o=>/1 tercio de litro|tercio/i.test(o))
      || s.ops[0];
    console.log('  >> respondo:', buena);
    await clickOp(buena);
    await page.waitForTimeout(1500);
    const f = await read();
    console.log('  tras responder: t=',f.t.toFixed(2),'paused=',f.paused,'estado=',JSON.stringify(f.estado.p1)+'/'+f.estado.m);
    console.log('  dock:', await page.evaluate(()=>document.querySelector('.dock')?.innerText.replace(/\s*\n+\s*/g,' ~ ').slice(-400)));
  }
  if (s.t > 200) { console.log('pasamos de largo'); break; }
  await page.waitForTimeout(700);
}
// ahora respondemos la correcta de price_effect
const s0 = await read();
const gira = s0.ops.find(o=>/gira/i.test(o) && /no se mueve|no cambia|se queda|clavado/i.test(o)) || s0.ops.find(o=>/gira/i.test(o));
console.log('\n>>> PULSO la opcion:', gira);
await clickOp(gira);
for (const ms of [300, 1200, 3000]) {
  await page.waitForTimeout(ms===300?300:ms-300);
  const s = await read(); P(`tras responder (+${ms}ms)`, s);
}
await page.screenshot({path:'vf-despues.png'});
fs.writeFileSync('vf-despues.json', JSON.stringify(await read(),null,1));
// dejar correr hasta 186 recogiendo subtitulos
let vistos = new Set();
while (true) {
  const s = await read();
  if (s.caps && !vistos.has(s.caps)) { vistos.add(s.caps); console.log(`  [cap t=${s.t.toFixed(1)}]`, s.caps.trim().slice(0,240)); }
  const k = JSON.stringify([s.estado.p1,s.estado.p2,s.estado.m,s.estado.fantasma]);
  if (k!==ultimo) { console.log(`[cambio de estado] t=${s.t.toFixed(2)} -> p1=${s.estado.p1} p2=${s.estado.p2} m=${s.estado.m} fantasma=${JSON.stringify(s.estado.fantasma)}`); ultimo=k; }
  if (s.t > 190 || (s.paused && s.hayActiva && s.t>180)) { P('FIN', s); break; }
  await page.waitForTimeout(600);
}
await page.screenshot({path:'vf-190.png'});
await browser.close();
