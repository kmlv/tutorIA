import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
let ronda=0;
for(let i=0;i<50;i++){
  const n=await U.nPreg();
  if(!await U.esperarNueva(n-1,8000)){console.log(`#${i}: NO llego pregunta nueva (n=${n})`); break;}
  await page.waitForTimeout(150);
  const s=await qInfo(page); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip')){ await U.clickJS(sel+'button:not([disabled])'); ronda++; }
  else if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(2)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input','7');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','x');await U.clickJS(sel+'button[type=submit]');}
}
console.log('items manip contestados con Listo sin arrastrar:', ronda);
console.log('preguntas montadas:', await U.nPreg());
console.log('practice.active:', await page.evaluate('window.__tutoria.practice.active'));
console.log('ultima pregunta:', JSON.stringify(await qInfo(page)));
console.log('ultimos mensajes:', (await msgs(page)).slice(-3));
await page.evaluate('document.scrollingElement.scrollTop=document.scrollingElement.scrollHeight');
await page.screenshot({path:SP+'tope-40.png'});
await browser.close();
