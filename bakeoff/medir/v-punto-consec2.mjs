import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
const NUM={q_int_numeric_1:'100',q_int_numeric_2:'33.33',q_slope_numeric:'-3',q_eq_numeric:'64',q_cs_m_numeric:'150'};
const info = ()=>page.evaluate(()=>{const p=document.querySelector('.punto-manip');const s=document.querySelector('svg.bgraph');
  if(!p)return null;const b=p.getBoundingClientRect();
  return {cx:+p.getAttribute('cx'),cy:+p.getAttribute('cy'),centro:[b.x+b.width/2,b.y+b.height/2],aria:s.getAttribute('aria-label')};});
// tolerancia de los tiradores de LINEA para comparar
let hechoLinea=false;
for(let i=0;i<26;i++){
  const n=await U.nPreg();
  if(!await U.esperarNueva(n-1,20000)){console.log('sin nueva pregunta');break;}
  await page.waitForTimeout(400);
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip') && q && q.manip_modo==='point'){
    await page.evaluate('document.scrollingElement.scrollTop=0'); await page.waitForTimeout(200);
    const I=await info();
    console.log('=== PUNTO', q.id, JSON.stringify(I));
    console.log('botones:', JSON.stringify(s.btns));
    // 1) intento fallido de agarre a 12 px + comprobar si el teclado sirve de rescate
    await page.mouse.move(I.centro[0]+12, I.centro[1]); await page.mouse.down();
    await page.mouse.move(I.centro[0]-30, I.centro[1]-30, {steps:6}); await page.mouse.up();
    await page.waitForTimeout(150);
    console.log('tras fallar el agarre a 12px:', JSON.stringify(await info()));
    console.log('foco activo:', await page.evaluate(()=>{const a=document.activeElement;return a?a.tagName+'/'+(a.getAttribute('role')||'')+'/'+(a.getAttribute('class')||''):'ninguno';}));
    // sin teclado
    await page.waitForTimeout(200);
    console.log('tras pulsar flechas SIN haber agarrado:', JSON.stringify(await info()));
    // 2) enviar sin mover -> que dice el corrector
    const L0=(await log(page)).length; const m0=(await msgs(page)).length;
    await U.clickJS(sel+'button:not([disabled])');
    await page.waitForTimeout(2500);
    const L=(await log(page)).slice(L0).filter(x=>x.url.includes('answer'));
    console.log('ENVIO sin mover ->', JSON.stringify(L.map(x=>({req:(x.req||'').slice(0,200), resp:(x.resp||'').slice(0,400)})),null,1));
    console.log('mensajes nuevos:', (await msgs(page)).slice(m0));
    await page.screenshot({path:SP+'v-punto-tras-envio.png'});
    break;
  }
  if(s.cls.includes('q-manip')){
    if(q.id==='q_cs_m_manip' && !hechoLinea){
      hechoLinea=true;
      await page.evaluate('document.scrollingElement.scrollTop=0'); await page.waitForTimeout(200);
      const tir = ()=>page.evaluate(()=>[...document.querySelectorAll('.capa-manip circle[cursor]')].map(c=>{const b=c.getBoundingClientRect();return {r:+c.getAttribute('r'),centro:[b.x+b.width/2,b.y+b.height/2],w:b.width};}));
      const t0=await tir(); console.log('=== LINEA', q.id, 'tiradores:', JSON.stringify(t0));
      for(const off of [0,10,15,18,20,22,25]){
        const t=(await tir())[0];
        const e=await page.evaluate(([x,y])=>{const el=document.elementFromPoint(x,y);return el?el.tagName+'.'+(el.getAttribute('class')||'')+'/r='+(el.getAttribute('r')||'')+'/cursor='+getComputedStyle(el).cursor:'null';},[t.centro[0]+off,t.centro[1]]);
        const antes=await page.evaluate(()=>document.querySelector('.capa-linea .recta.linea').getAttribute('x2'));
        await page.mouse.move(t.centro[0]+off,t.centro[1]); await page.mouse.down();
        await page.mouse.move(t.centro[0]+off+40,t.centro[1],{steps:6}); await page.mouse.up(); await page.waitForTimeout(120);
        const desp=await page.evaluate(()=>document.querySelector('.capa-linea .recta.linea').getAttribute('x2'));
        const movio=Math.abs(+desp-+antes)>1;
        console.log(`  tirador X off=${off}px elem=${e} -> ${movio?'ARRASTRA':'NADA'}`);
        if(movio){const t2=(await tir())[0]; await page.mouse.move(t2.centro[0],t2.centro[1]); await page.mouse.down(); await page.mouse.move(t0[0].centro[0],t0[0].centro[1],{steps:6}); await page.mouse.up(); await page.waitForTimeout(120);}
      }
    }
    if(q.id==='q_cs_m_manip'){await U.dragSvg([px(33.333),py(0)],[px(50),py(0)]);await U.dragSvg([px(0),py(100)],[px(0),py(150)]);}
    if(q.id==='q_cs_p_manip'){await U.dragSvg([px(33.333),py(0)],[px(25),py(0)]);}
    await U.clickJS(sel+'button:not([disabled])');
  }
  else if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input',NUM[q.id]||'1');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','La linea es la frontera del conjunto presupuestario.');await U.clickJS(sel+'button[type=submit]');}
}
await browser.close();
