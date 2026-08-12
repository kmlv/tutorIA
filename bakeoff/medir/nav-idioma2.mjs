import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es&t=130', {errores});
await page.waitForTimeout(800);
await page.evaluate(()=>window.__tutoria.media.seek(180));
await page.waitForTimeout(1000);
let s = await page.evaluate(SNAP);
console.log('en español, t=180:', JSON.stringify({reloj:s.reloj, cards:s.cards.map(c=>c.precio), eq:(s.eq||'').replace(/​/g,'')}));
console.log('banda renderizada (ES):', JSON.stringify(await page.evaluate(()=>document.querySelector('.eq-slot')?.innerText.replace(/\s+/g,' '))));
console.log('href idioma:', await page.getAttribute('.idioma','href'));
await page.click('.idioma');
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1500);
s = await page.evaluate(SNAP);
console.log('tras "English":', JSON.stringify({url:s.url, t:s.t, reloj:s.reloj, play:s.play, cap:(s.caption||'').slice(0,60), mostrar:Object.entries(s.estado.mostrar).filter(([,v])=>v).map(([k])=>k).join('+')}));
await browser.close();
// banda en inglés a t=180
{
  const {browser,page} = await abrir('http://localhost:57330/?lang=en&t=180', {errores});
  await page.waitForTimeout(1200);
  console.log('banda renderizada (EN):', JSON.stringify(await page.evaluate(()=>document.querySelector('.eq-slot')?.innerText.replace(/\s+/g,' '))));
  await browser.close();
}
if(errores.length) console.log('ERRORES', errores);
