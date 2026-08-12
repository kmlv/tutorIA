import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const SC='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
async function fresh(url='http://localhost:57330/?lang=es&t=0'){
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  return {ctx,page};
}
const snap = (page,label) => page.evaluate(() => {
  const dock=document.querySelector('.dock'), esc=document.querySelector('.escenario');
  const r=dock.getBoundingClientRect(), re=esc.getBoundingClientRect();
  const ask=document.querySelector('#ask');
  return {est:dock.dataset.estado, paused:window.__tutoria.media.paused(),
    t:+window.__tutoria.media.currentTime().toFixed(2),
    dockX:Math.round(r.x), escW:Math.round(re.width),
    play:document.querySelector('#play').textContent,
    askAria:{expanded:ask.getAttribute('aria-expanded'), pressed:ask.getAttribute('aria-pressed'), disabled:ask.disabled},
    bodyLen:(dock.querySelector('.dock-body').textContent||'').trim().length,
    chips:[...dock.querySelectorAll('.dock-acciones button')].map(b=>b.textContent.trim())};
}).then(s=>{console.log(label, JSON.stringify(s)); return s;});

console.log('\n===== F: API del dock y estados posibles =====');
{ const {ctx,page} = await fresh();
  const api = await page.evaluate(()=>{
    const dk = window.__tutoria.dock;
    return {keys:Object.keys(dk), proto:Object.getOwnPropertyNames(Object.getPrototypeOf(dk)||{})};
  });
  console.log('dock API:', JSON.stringify(api));
  await ctx.close(); }

console.log('\n===== G: Seguir con dock abierto, luego ✋ Preguntar otra vez =====');
{ const {ctx,page} = await fresh();
  await page.click('#play'); await page.waitForTimeout(1500);
  await page.click('#ask'); await page.waitForTimeout(500); await snap(page,'G abierto:');
  await page.click('#play'); await page.waitForTimeout(1500); await snap(page,'G tras Seguir (dock sigue):');
  await page.click('#ask'); await page.waitForTimeout(600); await snap(page,'G ✋ Preguntar de nuevo:');
  await ctx.close(); }

console.log('\n===== H: dock en estado activo (tras enviar pregunta), ¿✋ Preguntar cierra? =====');
{ const {ctx,page} = await fresh();
  await page.click('#play'); await page.waitForTimeout(1500);
  await page.click('#ask'); await page.waitForTimeout(500);
  await page.fill('.composer-input','por que sube la recta');
  await page.click('.composer-enviar');
  await page.waitForTimeout(6000);
  await snap(page,'H tras responder:');
  await page.click('#ask'); await page.waitForTimeout(800); await snap(page,'H ✋ Preguntar tras respuesta:');
  await page.keyboard.press('Escape'); await page.waitForTimeout(500); await snap(page,'H Escape:');
  await page.screenshot({path:SC+'H-activo.png'});
  await ctx.close(); }

console.log('\n===== I: ✋ Preguntar ANTES de Empezar (lección sin arrancar) =====');
{ const {ctx,page} = await fresh();
  await page.click('#ask'); await page.waitForTimeout(600); await snap(page,'I 1er clic sin empezar:');
  await page.click('#ask'); await page.waitForTimeout(600); await snap(page,'I 2o clic:');
  await ctx.close(); }

await browser.close();
