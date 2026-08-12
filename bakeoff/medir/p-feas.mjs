import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
const NUM={q_int_numeric_1:'100',q_int_numeric_2:'33.33',q_slope_numeric:'-3',q_eq_numeric:'64',q_cs_m_numeric:'150'};
for(let i=0;i<20;i++){
  const n=await U.nPreg();
  if(!await U.esperarNueva(n-1)) {console.log('no llego pregunta'); break;}
  await page.waitForTimeout(400);
  const s=await qInfo(page); const q=await U.ultQ();
  console.log(`#${i} ${q&&q.id} ${q&&q.modalidad}${q&&q.manip_modo?'/'+q.manip_modo:''}`);
  const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip')){
    if(q.manip_modo==='point'){
      console.log('>>> PUNTO:', s.enun,'|', s.nota);
      await page.evaluate('document.scrollingElement.scrollTop=0');
      console.log('capa:',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.capa-manip *')].map(e=>({t:e.tagName,c:e.getAttribute('class'),cx:e.getAttribute('cx'),cy:e.getAttribute('cy'),r:e.getAttribute('r'),fill:getComputedStyle(e).fill})))));
      await page.screenshot({path:SP+'manip-punto.png', fullPage:true});
      break;
    }
    if(q.id==='q_cs_m_manip'){await U.dragSvg([px(33.333),py(0)],[px(50),py(0)]);await U.dragSvg([px(0),py(100)],[px(0),py(150)]);}
    if(q.id==='q_cs_p_manip'){await U.dragSvg([px(33.333),py(0)],[px(25),py(0)]);}
    await U.clickJS(sel+'button:not([disabled])');
  }
  else if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input',NUM[q.id]||'1');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','La linea es la frontera del conjunto presupuestario; el conjunto incluye canastas que no agotan el ingreso.');await U.clickJS(sel+'button[type=submit]');}
}
console.log((await msgs(page)).slice(-3));
await browser.close();
