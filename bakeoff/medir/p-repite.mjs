import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
for(let i=0;i<10;i++){
  const n=await U.nPreg(); if(!await U.esperarNueva(n-1,12000)){console.log('sin nueva');break;}
  await page.waitForTimeout(300);
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  console.log(`#${i} ${q&&q.id}`);
  if(s.cls.includes('q-manip')){
    await page.evaluate('document.scrollingElement.scrollTop=0');
    // respuesta EQUIVOCADA de verdad: mueve solo el extremo x (cambia la pendiente)
    const L0=(await log(page)).length;
    await U.dragSvg([px(33.333),py(0)],[px(45),py(0)]);
    console.log('   tiradores', await page.evaluate(()=>[...document.querySelectorAll('.capa-manip .tirador')].map(t=>[Math.round(+t.getAttribute('cx')),Math.round(+t.getAttribute('cy'))])));
    await U.clickJS(sel+'button:not([disabled])');
    await page.waitForTimeout(1200);
    const nuevos=(await log(page)).slice(L0).filter(x=>x.url.includes('answer'));
    console.log('   ANSWER:', nuevos.map(x=>x.req+' => '+x.resp).join(' | ')||'NINGUNA');
    console.log('   dice:', (await msgs(page)).slice(-1));
  }
  else if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input','150');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','x');await U.clickJS(sel+'button[type=submit]');}
}
await browser.close();
