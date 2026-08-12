import {open} from './lib-drive.mjs';
const dump = (page) => page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(e=>e.className+' :: '+e.textContent.trim().slice(0,70)));
const {browser, page} = await open('http://localhost:57330/?lang=es');
const reqs=[]; page.on('request', r=>{ if(/api|tutor|chat|ask/.test(r.url())) reqs.push(r.method()+' '+r.url()); });
// abrir el dock fuera de checkpoint
await page.evaluate(()=>{window.__tutoria.media.seek(60); window.__tutoria.media.play();});
await page.waitForTimeout(1500);
await page.click('#ask');
await page.waitForTimeout(800);
console.log('dock abierto fuera de checkpoint. chips:', await page.evaluate(()=>[...document.querySelectorAll('.dock button')].map(b=>b.textContent.trim())));
for (const c of ['No entiendo','¿Por qué?']) {
  await page.evaluate((n)=>{const b=[...document.querySelectorAll('.dock button')].filter(b=>b.textContent.trim()===n).pop(); b.click();}, c);
  await page.waitForTimeout(8000);
  console.log(`tras "${c}":`, JSON.stringify(await dump(page)));
}
console.log('\nred:', JSON.stringify(reqs,null,1));
await browser.close();
