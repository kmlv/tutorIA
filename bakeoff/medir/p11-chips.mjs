import {open, snap} from './lib-drive.mjs';
const dockTxt = p => p.evaluate(()=>(document.querySelector('.dock')||{}).innerText.replace(/\n+/g,' | ').trim());
async function go(label, seekTo, waitSel, fn) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate((s)=>{window.__tutoria.media.seek(s); window.__tutoria.media.play();}, seekTo);
  await page.waitForFunction((sel)=>document.querySelectorAll(sel).length>0, waitSel, {timeout:25000});
  await page.waitForTimeout(500);
  console.log('\n########', label);
  try { await fn(page); } catch(e){ console.log('  ERROR:', String(e).slice(0,250)); }
  await browser.close();
}
const clickChip = async (page, name) => page.evaluate((n)=>{const b=[...document.querySelectorAll('.dock button')].filter(b=>b.textContent.trim()===n).pop(); if(!b) throw new Error('no chip '+n); b.click();}, name);

for (const chip of ['No entiendo','Otro ejemplo','Más despacio','¿Por qué?']) {
  await go(`CP1 SIN contestar -> "${chip}"`, 143, '.q-opciones button', async (page)=>{
    const before = await dockTxt(page);
    await clickChip(page, chip);
    let changed = false;
    for (let i=0;i<6;i++){ await page.waitForTimeout(2500); const now = await dockTxt(page);
      if (now.replace(before,'').length > chip.length+5) { changed=true; console.log(`  respuesta a los ${(i+1)*2.5}s`); break; } }
    const fin = await dockTxt(page);
    console.log('  hubo respuesta del tutor?', changed);
    console.log('  dock:', fin);
    const s = await snap(page); console.log('  t=',s.t,'paused=',s.paused);
  });
}
for (const chip of ['No entiendo','¿Por qué?','Otro ejemplo','Más despacio']) {
  await go(`CP1 TRAS FALLAR -> "${chip}"`, 143, '.q-opciones button', async (page)=>{
    await page.click('.q-opciones button:nth-child(2)');
    await page.waitForTimeout(1500);
    const before = await dockTxt(page);
    await clickChip(page, chip);
    let changed=false;
    for (let i=0;i<6;i++){ await page.waitForTimeout(2500); const now = await dockTxt(page);
      if (now.length > before.length + chip.length + 6) { changed=true; console.log(`  respuesta a los ${(i+1)*2.5}s`); break; } }
    console.log('  hubo respuesta del tutor?', changed);
    console.log('  dock:', await dockTxt(page));
  });
}
