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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.click('#ask');
await page.waitForTimeout(800);

const snap = () => page.evaluate(() => {
  const inp = document.querySelector('.composer-input');
  const btn = document.querySelector('.composer-enviar');
  const form = document.querySelector('.composer');
  const rest = document.querySelector('.composer-restantes');
  const cs = inp ? getComputedStyle(inp) : null;
  const burb = [...document.querySelectorAll('.dock .burbuja, .dock [class*=burbuja], .dock [class*=msg], .dock [class*=mensaje]')].map(e=>e.className+' :: '+e.innerText.slice(0,120));
  return {
    restantes: rest ? rest.textContent : null,
    agotadoForm: form ? form.getAttribute('data-agotado') : null,
    agotadoInp: inp ? inp.getAttribute('data-agotado') : null,
    inpDisabled: inp?.disabled, inpReadonly: inp?.readOnly,
    inpPH: inp?.getAttribute('placeholder'),
    inpPointer: cs?.pointerEvents, inpOpacity: cs?.opacity,
    btnDisabled: btn?.disabled,
    nBurbujas: burb.length,
    ultimas: burb.slice(-2),
  };
});

console.log('ANTES DE NADA:', JSON.stringify(await snap()));

async function preguntar(txt) {
  await page.fill('.composer-input', txt);
  await page.click('.composer-enviar');
  // esperar a que llegue respuesta del tutor
  await page.waitForTimeout(300);
  try {
    await page.waitForFunction(() => {
      const b = document.querySelector('.composer-enviar');
      return b && !b.disabled && !document.querySelector('.dock [class*=pensando], .dock [class*=escribiendo]');
    }, null, {timeout: 40000});
  } catch(e) { console.log('  timeout esperando respuesta'); }
  await page.waitForTimeout(500);
}

for (let i=1; i<=12; i++) {
  await preguntar(`Pregunta numero ${i}: ¿que significa la pendiente aqui?`);
  const s = await snap();
  console.log(`tras pregunta ${i}: restantes=${JSON.stringify(s.restantes)} agotadoForm=${s.agotadoForm} agotadoInp=${s.agotadoInp} btnDis=${s.btnDisabled} inpDis=${s.inpDisabled} ph=${JSON.stringify(s.inpPH)} pe=${s.inpPointer} op=${s.inpOpacity} nBurb=${s.nBurbujas}`);
}
await page.screenshot({path:'verif-lim-12.png', fullPage:false});
console.log('\n=== ESTADO CON CONTADOR SUPUESTAMENTE EN 0 ===');
console.log(JSON.stringify(await snap(), null, 2));

// la pregunta 13, la real
console.log('\n=== ENVIANDO LA PREGUNTA 13 ===');
const antes = await page.evaluate(()=>document.querySelector('.dock').innerText.length);
await preguntar('No entiendo por que la pendiente es negativa, ¿me lo explicas?');
const s13 = await snap();
console.log('tras 13:', JSON.stringify(s13, null, 2));
const dockTxt = await page.evaluate(()=>document.querySelector('.dock').innerText);
console.log('\n--- COLA DEL DOCK ---\n' + dockTxt.slice(-1200));
await page.screenshot({path:'verif-lim-13.png'});
await browser.close();
