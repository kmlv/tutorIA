import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
const graf = ()=>page.evaluate(()=>{const s=document.querySelector('svg.bgraph');
  return {textos:[...s.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent), manip: !!s.querySelector('.capa-manip'),
    aria:s.getAttribute('aria-label').slice(60)};});
let vistas=0;
for(let i=0;i<5;i++){
  if(!await U.esperarNueva(vistas,15000)){console.log('sin nueva');break;}
  vistas = await U.nPreg();
  await page.waitForTimeout(300);
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  console.log(`#${i} ${q&&q.id} :: grafico ->`, JSON.stringify(await graf()));
  if(s.cls.includes('q-manip')){
    await page.evaluate('document.scrollingElement.scrollTop=0');
    await U.dragSvg([px(33.333),py(0)],[px(50),py(0)]); await U.dragSvg([px(0),py(100)],[px(0),py(150)]);
    await U.clickJS(sel+'button:not([disabled])');
  }
  else if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){ console.log('   >>> numerico:', s.enun);
    await page.evaluate('document.scrollingElement.scrollTop=0'); await page.screenshot({path:SP+'residuo.png'});
    await page.fill(sel+'.q-input','150'); await U.clickJS(sel+'button[type=submit]'); }
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','x');await U.clickJS(sel+'button[type=submit]');}
}
await browser.close();
