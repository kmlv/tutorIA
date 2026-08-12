import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
const NUM={q_int_numeric_1:'100',q_int_numeric_2:'33.33',q_slope_numeric:'-3',q_eq_numeric:'64',q_cs_m_numeric:'150'};
for(let i=0;i<26;i++){
  const n=await U.nPreg();
  if(!await U.esperarNueva(n-1,20000)){console.log('sin nueva'); break;}
  await page.waitForTimeout(400);
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip') && q && q.manip_modo==='point'){
    await page.evaluate('document.scrollingElement.scrollTop=0'); await page.waitForTimeout(200);
    const pos=await page.evaluate(()=>{const p=document.querySelector('.punto-manip');const b=p.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2];});
    // fallo de agarre realista: 12 px a la derecha del centro
    await page.mouse.move(pos[0]+12,pos[1]); await page.mouse.down();
    await page.mouse.move(pos[0]-40,pos[1]-40,{steps:8}); await page.mouse.up(); await page.waitForTimeout(200);
    const nQ0=await U.nPreg(), L0=(await log(page)).length, m0=(await msgs(page)).length;
    console.log('clic en Listo:', await U.clickJS(sel+'button:not([disabled])'));
    for (const t of [1000,3000,8000]){
      await page.waitForTimeout(t===1000?1000:t-(t===3000?1000:3000));
      console.log(` t=${t}ms  peticiones=${(await log(page)).length-L0}  mensajesNuevos=${JSON.stringify((await msgs(page)).slice(m0))}  preguntas=${nQ0}->${await U.nPreg()}  dock=${JSON.stringify(await page.evaluate('window.__tutoria.dock.actual'))}  botones=${JSON.stringify((await qInfo(page)).btns)}`);
    }
    console.log('enunciado actual:', (await qInfo(page)).enun);
    console.log('sesion telemetria /events:', JSON.stringify((await log(page)).slice(L0).map(x=>x.url+' '+(x.req||'').slice(0,120))));
    await page.screenshot({path:SP+'v-listo2.png'});
    break;
  }
  if(s.cls.includes('q-manip')){
    if(q.id==='q_cs_m_manip'){await U.dragSvg([px(33.333),py(0)],[px(50),py(0)]);await U.dragSvg([px(0),py(100)],[px(0),py(150)]);}
    if(q.id==='q_cs_p_manip'){await U.dragSvg([px(33.333),py(0)],[px(25),py(0)]);}
    await U.clickJS(sel+'button:not([disabled])');
  }
  else if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input',NUM[q.id]||'1');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','La linea es la frontera del conjunto presupuestario.');await U.clickJS(sel+'button[type=submit]');}
}
await browser.close();
