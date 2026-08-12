import {abrir, hastaManip, msgs} from './manip-lib.mjs';
for (const lang of ['es','en']) {
  const {browser, page, red} = await abrir({lang});
  const m = await hastaManip(page);
  console.log(`\n=== ${lang.toUpperCase()} manip:`, m && m.enun, '| nota:', m && m.nota);
  const lee = async ()=> await page.evaluate(()=>({aria:document.querySelector('svg.bgraph').getAttribute('aria-label'), bands:document.querySelector('.bands').innerText.replace(/\n+/g,' | ')}));
  console.log('  inicial:', (await lee()).aria);
  // RUTA TECLADO (la que usa un lector de pantalla)
  const foco = await page.evaluate(()=>{const f=document.querySelector('svg.bgraph .capa-manip [tabindex], svg.bgraph [tabindex]'); if(f){f.focus(); return {tag:f.tagName, cls:f.getAttribute('class'), tabindex:f.getAttribute('tabindex'), role:f.getAttribute('role'), al:f.getAttribute('aria-label')};} return null;});
  console.log('  elemento enfocable:', JSON.stringify(foco));
  for (let i=0;i<10;i++){ await page.keyboard.press('ArrowRight'); await page.waitForTimeout(30); }
  console.log('  tras 10 ArrowRight:', (await lee()).aria);
  console.log('  banda:', (await lee()).bands.slice(0,160));
  await browser.close();
}
