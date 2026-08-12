import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SC='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

async function fresh(){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=es&t=0', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return {ctx, page};
}
const snap = (page,label) => page.evaluate(() => {
  const dock=document.querySelector('.dock'), esc=document.querySelector('.escenario');
  const r=dock&&dock.getBoundingClientRect(), re=esc&&esc.getBoundingClientRect();
  return {est:dock.dataset.estado, dockActual:window.__tutoria.dock.actual,
    paused:window.__tutoria.media.paused(), t:+window.__tutoria.media.currentTime().toFixed(2),
    dockX:Math.round(r.x), dockW:Math.round(r.width),
    escX:Math.round(re.x), escW:Math.round(re.width),
    play:(document.querySelector('#play')||{}).textContent};
}).then(s=>{console.log(label, JSON.stringify(s)); return s;});

// ---------- ESCENARIO A: abrir y pulsar "Seguir" ----------
console.log('\n===== A: abrir dock, pulsar Seguir =====');
{ const {ctx,page} = await fresh();
  await page.click('#play'); await page.waitForTimeout(1500);
  await page.click('#ask'); await page.waitForTimeout(600);
  await snap(page,'A abierto:');
  await page.click('#play');  // "Seguir"
  await page.waitForTimeout(2000);
  await snap(page,'A tras Seguir +2s:');
  await page.screenshot({path:SC+'A-seguir-con-dock.png'});
  await ctx.close(); }

// ---------- ESCENARIO B: "Listo, sigamos" ----------
console.log('\n===== B: abrir dock, pulsar "Listo, sigamos" =====');
{ const {ctx,page} = await fresh();
  await page.click('#play'); await page.waitForTimeout(1500);
  await page.click('#ask'); await page.waitForTimeout(600);
  await page.locator('.dock button', {hasText:'Listo, sigamos'}).click();
  await page.waitForTimeout(1500);
  await snap(page,'B tras Listo sigamos:');
  await ctx.close(); }

// ---------- ESCENARIO C: clic fuera del dock (en el escenario/lienzo) ----------
console.log('\n===== C: abrir dock, clic fuera =====');
{ const {ctx,page} = await fresh();
  await page.click('#play'); await page.waitForTimeout(1500);
  await page.click('#ask'); await page.waitForTimeout(600);
  await snap(page,'C abierto:');
  await page.mouse.click(400, 400);
  await page.waitForTimeout(600);
  await snap(page,'C tras clic en escenario (400,400):');
  await page.mouse.click(60, 820);
  await page.waitForTimeout(600);
  await snap(page,'C tras clic abajo-izq:');
  await ctx.close(); }

// ---------- ESCENARIO D: Escape con foco dentro del dock / composer ----------
console.log('\n===== D: Escape con distintos focos =====');
{ const {ctx,page} = await fresh();
  await page.click('#play'); await page.waitForTimeout(1500);
  await page.click('#ask'); await page.waitForTimeout(600);
  for (const sel of ['.composer-input','.dock','#ask','body']) {
    await page.evaluate(s=>{const e=document.querySelector(s); e&&e.focus&&e.focus();}, sel);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await snap(page,`D Escape foco=${sel}:`);
  }
  // teclas alternativas
  for (const k of ['KeyQ','Backspace']) {
    await page.evaluate(()=>document.body.focus());
    await page.keyboard.press(k); await page.waitForTimeout(300);
    await snap(page,`D tecla ${k}:`);
  }
  await ctx.close(); }

// ---------- ESCENARIO E: doble clic rapido en #ask (toggle?) ----------
console.log('\n===== E: doble clic rapido en #ask =====');
{ const {ctx,page} = await fresh();
  await page.click('#play'); await page.waitForTimeout(1500);
  await page.click('#ask'); await page.click('#ask');
  await page.waitForTimeout(800);
  await snap(page,'E tras doble clic:');
  await ctx.close(); }

await browser.close();
