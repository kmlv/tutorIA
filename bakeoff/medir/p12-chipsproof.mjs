import {open} from './lib-drive.mjs';
const {browser, page} = await open('http://localhost:57330/?lang=es');
await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button').length>0, null, {timeout:25000});
await page.waitForTimeout(500);
const dump = () => page.evaluate(()=>{
  const dock=document.querySelector('.dock');
  const kids=[...dock.querySelectorAll('*')].filter(e=>/mensaje|msg|turno|burbuja|bubble/.test(e.className||''));
  return kids.map(e=>({cls:e.className, txt:e.textContent.trim().slice(0,70)}));
});
console.log('estructura inicial:'); console.log(JSON.stringify(await dump(),null,1));
const seq = ['No entiendo','Otro ejemplo','Más despacio','¿Por qué?'];
for (const c of seq) {
  await page.evaluate((n)=>{[...document.querySelectorAll('.dock button')].filter(b=>b.textContent.trim()===n).pop().click();}, c);
  await page.waitForTimeout(6000);
  console.log(`\n>>> tras pulsar "${c}" (6s):`);
  console.log(JSON.stringify(await dump(),null,1));
}
console.log('\n>>> ahora por el composer: "no entiendo"');
await page.fill('.composer-input','no entiendo');
await page.click('.composer-enviar');
await page.waitForTimeout(9000);
console.log(JSON.stringify(await dump(),null,1));
await browser.close();
