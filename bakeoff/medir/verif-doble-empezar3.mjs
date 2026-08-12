import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

async function nueva() {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('    JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0', null, {timeout:30000});
  return {ctx, page};
}

console.log('== A) LATENCIA de reaccion del boton tras UN clic ==');
{
  const {ctx, page} = await nueva();
  await page.evaluate(() => {
    window.__lat = {};
    const p = document.querySelector('#play');
    const obs = new MutationObserver(() => {
      if (p.textContent.trim() !== 'Empezar' && window.__lat.label == null)
        window.__lat.label = performance.now() - window.__lat.click;
    });
    obs.observe(p, {childList:true, subtree:true, characterData:true});
    p.addEventListener('click', () => { window.__lat.click = performance.now(); }, {capture:true});
    const m = window.__tutoria.media;
    m.on('play',    () => window.__lat.play    ??= performance.now() - window.__lat.click);
    m.on('playing', () => window.__lat.playing ??= performance.now() - window.__lat.click);
    m.on('timeupdate', () => { if (m.currentTime() > 0) window.__lat.avanza ??= performance.now() - window.__lat.click; });
  });
  await page.click('#play');
  await page.waitForTimeout(1500);
  const lat = await page.evaluate(() => window.__lat);
  console.log('  ms desde el clic ->', JSON.stringify({
    etiquetaCambia: lat.label!=null?+lat.label.toFixed(1):null,
    eventoPlay: lat.play!=null?+lat.play.toFixed(1):null,
    eventoPlaying: lat.playing!=null?+lat.playing.toFixed(1):null,
    relojAvanza: lat.avanza!=null?+lat.avanza.toFixed(1):null }));
  console.log('  boton ahora:', await page.textContent('#play'));
  await ctx.close();
}

console.log('== B) comparar: DOBLE CLIC  vs  play + pausa deliberada ==');
async function estado(page){ return page.evaluate(() => ({
  boton: document.querySelector('#play').textContent.trim(),
  reloj: document.querySelector('#reloj').textContent.trim(),
  paused: window.__tutoria.media.paused(),
  t:+window.__tutoria.media.currentTime().toFixed(2),
  escenarioOn: document.querySelector('.escenario')?.dataset.on ?? null,
  dock: window.__tutoria.dock.actual,
  bandas: document.querySelectorAll('.bands *').length,
  lienzoPaths: document.querySelectorAll('.lienzo path, .lienzo line, .lienzo circle').length,
}));}
{
  const {ctx, page} = await nueva();
  await page.dblclick('#play'); await page.waitForTimeout(1500);
  console.log('  doble clic     :', JSON.stringify(await estado(page)));
  await ctx.close();
}
{
  const {ctx, page} = await nueva();
  await page.click('#play'); await page.waitForTimeout(60); await page.click('#play');
  await page.waitForTimeout(1500);
  console.log('  play+pausa 60ms:', JSON.stringify(await estado(page)));
  await ctx.close();
}
{
  const {ctx, page} = await nueva();
  await page.waitForTimeout(1500);
  console.log('  sin tocar nada :', JSON.stringify(await estado(page)));
  await ctx.close();
}

console.log('== C) recuperacion tras doble clic: 3er clic y reproduccion sostenida ==');
{
  const {ctx, page} = await nueva();
  await page.dblclick('#play'); await page.waitForTimeout(1000);
  await page.click('#play'); await page.waitForTimeout(4000);
  console.log('  tras 3er clic +4s:', JSON.stringify(await estado(page)));
  await ctx.close();
}

console.log('== D) triple / cuadruple clic ==');
for (const n of [3,4]) {
  const {ctx, page} = await nueva();
  for (let i=0;i<n;i++){ await page.click('#play'); await page.waitForTimeout(50); }
  await page.waitForTimeout(2000);
  console.log(`  ${n} clics:`, JSON.stringify(await estado(page)));
  await ctx.close();
}
await browser.close();
