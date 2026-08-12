import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const OUT = '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});

async function corrida(lang) {
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`  [${lang}] JS ERROR:`, String(e).slice(0,200)));
  await page.goto(`http://localhost:57330/?lang=${lang}&t=0`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => window.__tutoria.media.pause());

  // contador ANTES de preguntar nada
  const antes = await page.evaluate(() => {
    const c = document.querySelector('.composer-restantes');
    return {existe: !!c, texto: c ? c.textContent : null, visible: c ? !!c.offsetParent : null};
  });
  console.log(`[${lang}] contador al cargar:`, JSON.stringify(antes));

  // pulsar "Preguntar"/"Ask" (#ask)
  const askTxt = await page.evaluate(() => {
    const b = document.querySelector('#ask'); return b ? b.textContent.trim() : null;
  });
  console.log(`[${lang}] boton #ask:`, JSON.stringify(askTxt));
  await page.click('#ask').catch(e=>console.log(`[${lang}] no click #ask`, e.message.slice(0,80)));
  await page.waitForTimeout(600);

  await page.fill('.composer-input', lang==='es' ? '¿por que la recta baja?' : 'why does the line slope down?');
  await page.click('.composer-enviar');
  // esperar a que el contador cambie
  await page.waitForFunction(() => {
    const c = document.querySelector('.composer-restantes');
    return c && c.textContent.trim().length > 0;
  }, null, {timeout: 60000}).catch(()=>console.log(`[${lang}] contador nunca se llenó`));
  await page.waitForTimeout(400);

  const tras1 = await page.evaluate(() => {
    const c = document.querySelector('.composer-restantes');
    const f = document.querySelector('.composer');
    const inp = document.querySelector('.composer-input');
    const msgs = [...document.querySelectorAll('.dock .msg')].map(m=>m.className+' :: '+m.textContent.trim().slice(0,140));
    return {contador: c && c.textContent, agotado: f && f.dataset.agotado,
            inputDisabled: inp && inp.disabled, msgs: msgs.slice(-3)};
  });
  console.log(`[${lang}] tras 1 pregunta:`, JSON.stringify(tras1, null, 1));
  await page.screenshot({path: `${OUT}/contador-1-${lang}.png`, clip:{x:900,y:600,width:380,height:260}});
  return {ctx, page};
}

const es = await corrida('es');
const en = await corrida('en');
fs.writeFileSync(`${OUT}/hecho.txt`, 'ok');
await browser.close();
