import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.evaluate(()=>window.__tutoria.media.seek(100));
await page.waitForTimeout(600);
for (const k of ['ArrowLeft','ArrowRight','Space','KeyJ','KeyL','Comma','Home','End','Digit5','PageUp']) {
  const antes = await page.evaluate(()=>window.__tutoria.media.currentTime());
  await page.keyboard.press(k.startsWith('Key')||k.startsWith('Digit')?k.replace('Key','').replace('Digit',''):k);
  await page.waitForTimeout(400);
  const desp = await page.evaluate(()=>window.__tutoria.media.currentTime());
  if (Math.abs(desp-antes) > 0.6) console.log(`tecla ${k}: ${antes.toFixed(2)} -> ${desp.toFixed(2)}  *** NAVEGA ***`);
}
console.log('fin prueba teclado; t=', await page.evaluate(()=>window.__tutoria.media.currentTime()));
// ¿hay listeners de teclado?
console.log('¿scrubber?', await page.evaluate(()=>document.querySelectorAll('input[type=range],[role=slider],progress').length));
await browser.close();
