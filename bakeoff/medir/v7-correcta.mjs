import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const ids=[];
page.on('response', async r => { if(r.url().includes('/next')) { try{ const j=JSON.parse(await r.text()); ids.push(j.question ? j.question.id+'/'+j.question.modalidad : 'DONE:'+j.done); }catch(e){} } });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate(`__tutoria.media.seek(__tutoria.media.duration()-1.2); __tutoria.media.play();`);
await page.waitForSelector('.q', {timeout:40000});
await page.waitForTimeout(1200);
// responder BIEN la primera
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela', exact:true}).first().click();
await page.waitForTimeout(2500);
// avanzar respondiendo lo que sea hasta encontrar un manip
for (let i=0;i<8;i++){
  const hay = await page.evaluate(() => !!document.querySelector('.q-manip:last-of-type'));
  const st = await page.evaluate(() => { const qs=[...document.querySelectorAll('.q')]; const l=qs[qs.length-1]; return {cls:l?.className, enun:l?.querySelector('.q-enunciado')?.textContent, btns:[...l.querySelectorAll('button')].map(b=>b.textContent.trim()), inputs:l.querySelectorAll('input').length}; });
  console.log('paso',i,JSON.stringify(st));
  if(st.cls?.includes('q-manip')) { console.log('>>> MANIP ALCANZADO tras respuesta CORRECTA'); break; }
  // responder: si hay input numerico pon algo, si no primer boton
  await page.evaluate(() => { const qs=[...document.querySelectorAll('.q')]; const l=qs[qs.length-1];
    const inp=l.querySelector('input'); if(inp){ inp.value='150'; inp.dispatchEvent(new Event('input',{bubbles:true})); const b=[...l.querySelectorAll('button')].find(x=>/responder|answer/i.test(x.textContent)); b&&b.click(); return; }
    const b=[...l.querySelectorAll('button')].find(x=>!x.disabled); b&&b.click(); });
  await page.waitForTimeout(2500);
}
console.log('secuencia /next:', JSON.stringify(ids));
await browser.close();
