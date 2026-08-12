import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

// A) intenciones durante la NARRACIÓN (contraste)
{
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  const net=[]; page.on('request', r=>{ if(r.url().includes('/api/')&&r.method()==='POST') net.push(r.url().replace(/.*\/api\/session\/[^/]+\//,'')+' '+(r.postData()||'').slice(0,120)); });
  await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(60);m.play();});
  await page.waitForTimeout(2000);
  await page.click('#ask'); await page.waitForTimeout(800);
  const n0=net.length;
  await page.locator('.dock-acciones button',{hasText:'No entiendo'}).first().click();
  await page.waitForTimeout(12000);
  console.log('A) NARRACIÓN, "No entiendo" ->', JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('.dock-body > *')).slice(-3).map(n=>n.className+' :: '+n.textContent.trim().slice(0,90)))));
  console.log('   net:', net.slice(n0));
  await page.close(); await ctx.close();
}
// B) alcanzabilidad del composer en varias resoluciones, con la práctica en marcha
for (const [w,h] of [[1440,900],[1280,800],[1366,768],[1280,860]]){
  const ctx = await browser.newContext({viewport:{width:w,height:h}});
  const page = await ctx.newPage();
  await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await page.evaluate(()=>{const m=window.__tutoria.media;m.seek(m.duration()-1.2);m.play();});
  await page.waitForSelector('.dock-body .pregunta .q-opcion');
  await page.waitForTimeout(600);
  const g = await page.evaluate(()=>{const e=document.querySelector('.composer-enviar'); const r=e.getBoundingClientRect();
    const d=document.querySelector('.dock').getBoundingClientRect();
    return {vh:innerHeight, enviarBottom:Math.round(r.bottom), dockBottom:Math.round(d.bottom), docScroll: document.scrollingElement.scrollHeight-document.scrollingElement.clientHeight};});
  let clic='OK'; try{ await page.click('.composer-enviar',{timeout:4000}); }catch(e){ clic='NO CLICABLE'; }
  console.log(`B) ${w}x${h} -> enviarBottom=${g.enviarBottom} vh=${g.vh} dockBottom=${g.dockBottom} scrollDisponible=${g.docScroll}px  clicEnviar=${clic}`);
  if (clic==='NO CLICABLE') await page.screenshot({path:`probe/composer-${w}x${h}.png`});
  await page.close(); await ctx.close();
}
await browser.close();
