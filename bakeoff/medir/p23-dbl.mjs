import {open} from './lib-drive.mjs';
for (const modo of ['dblclick','dos clics rapidos','Enter x2 con teclado']) {
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
  await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button').length>0,null,{timeout:25000});
  await page.waitForTimeout(400);
  const sel='.q-opciones button:nth-child(1)';
  if (modo==='dblclick') await page.dblclick(sel);
  else if (modo==='dos clics rapidos') { const b=await page.$(sel); const r=await b.boundingBox(); await page.mouse.click(r.x+r.width/2, r.y+r.height/2); await page.mouse.click(r.x+r.width/2, r.y+r.height/2, {delay:0}); }
  else { await page.focus(sel); await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await page.keyboard.press('Space'); }
  await page.waitForTimeout(2500);
  console.log(modo, '->', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.textContent.trim()))));
  await browser.close();
}
