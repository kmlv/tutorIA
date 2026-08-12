import {open} from './lib-drive.mjs';
const {browser, page} = await open('http://localhost:57330/?lang=en');
await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button').length>0,null,{timeout:25000});
await page.waitForTimeout(500);
console.log('EN chips:', await page.evaluate(()=>[...document.querySelectorAll('.dock button')].map(b=>b.textContent.trim())));
await page.evaluate(()=>{const b=[...document.querySelectorAll('.dock button')].find(b=>/get it|entiendo/i.test(b.textContent)); b.click();});
await page.waitForTimeout(9000);
console.log('EN tras chip:', await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.className+' :: '+m.textContent.trim().slice(0,60))));
// cp2 en EN
await page.evaluate(()=>{window.__tutoria.media.seek(192.5); window.__tutoria.media.play();});
await page.waitForFunction(()=>document.querySelectorAll('.q textarea').length>0,null,{timeout:25000});
await page.waitForTimeout(500);
await page.fill('.q textarea','asdf');
await page.evaluate(()=>{[...document.querySelectorAll('.q button')].find(b=>/responder|answer|submit/i.test(b.textContent)).click();});
await page.waitForTimeout(6000);
console.log('EN cp2 tras "asdf":', await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].slice(-2).map(m=>m.className+' :: '+m.textContent.trim().slice(0,90))));
console.log('EN banda:', await page.evaluate(()=>document.querySelector('.bands').innerText.replace(/\s+/g,' ').slice(0,200)));
await browser.close();
