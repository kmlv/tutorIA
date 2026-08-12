import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
const MODO = process.argv[2]||'sindragar';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
const NUM={q_int_numeric_1:'100',q_int_numeric_2:'33.33',q_slope_numeric:'-3',q_eq_numeric:'64',q_cs_m_numeric:'150'};
const punto = ()=>page.evaluate(()=>{const p=document.querySelector('.punto-manip'); const s=document.querySelector('svg.bgraph');
  const b=p.getBoundingClientRect();
  return {cx:+p.getAttribute('cx'),cy:+p.getAttribute('cy'), pantalla:[Math.round(b.x+b.width/2),Math.round(b.y+b.height/2)], aria:s.getAttribute('aria-label')};});
for(let i=0;i<24;i++){
  const n=await U.nPreg();
  if(!await U.esperarNueva(n-1,20000)){console.log('sin nueva pregunta');break;}
  await page.waitForTimeout(400);
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip') && q.manip_modo==='point'){
    await page.evaluate('document.scrollingElement.scrollTop=0');
    console.log('PUNTO inicial', JSON.stringify(await punto()));
    if(MODO==='sindragar'){
      const antes=(await msgs(page)).length;
      const L0=(await log(page)).length;
      await U.clickJS(sel+'button:not([disabled])');
      await page.waitForTimeout(2500);
      const L=(await log(page)).slice(L0);
      console.log('PETICIONES tras Listo sin arrastrar:', JSON.stringify(L.map(x=>x.url+' <- '+(x.req||'').slice(0,90)),null,1));
      console.log('mensajes nuevos:', (await msgs(page)).slice(antes));
      console.log('boton', (await qInfo(page)).btns, ' misma pregunta?', (await qInfo(page)).enun===s.enun);
    } else if(MODO==='fuera'){
      // arrastrar el punto MUY fuera del grafico (abajo-derecha del viewport)
      const p0=await punto();
      const m=await U.ctm();
      await page.mouse.move(p0.pantalla[0],p0.pantalla[1]); await page.mouse.down();
      for(let k=1;k<=15;k++){ await page.mouse.move(p0.pantalla[0]+(1270-p0.pantalla[0])*k/15, p0.pantalla[1]+(850-p0.pantalla[1])*k/15); await page.waitForTimeout(16); }
      await page.mouse.up(); await page.waitForTimeout(150);
      console.log('PUNTO tras arrastrar fuera', JSON.stringify(await punto()));
      await page.screenshot({path:SP+'punto-fuera.png'});
      console.log('elementFromPoint donde deberia estar:', await page.evaluate((p)=>{const e=document.elementFromPoint(p[0],p[1]);return p+' -> '+(e?e.tagName+'.'+(e.getAttribute('class')||''):'null');}, (await punto()).pantalla));
      const L0=(await log(page)).length;
      await U.clickJS(sel+'button:not([disabled])'); await page.waitForTimeout(2500);
      console.log('tras Listo:', JSON.stringify((await log(page)).slice(L0).map(x=>x.url+' <- '+(x.req||'').slice(0,120)+' => '+(x.resp||'').slice(0,140)),null,1));
      console.log('mensajes', (await msgs(page)).slice(-2));
    } else if(MODO==='tolerancia'){
      const pos = ()=>page.evaluate(()=>{const c=document.querySelector('.punto-manip');const b=c.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,w:b.width,cx:+c.getAttribute('cx')};});
      console.log('PUNTO en pantalla', JSON.stringify(await pos()));
      for (const off of [0,6,8,9,10,12,16,22]){
        const a = await pos();
        await page.mouse.move(a.x+off,a.y); await page.mouse.down();
        for(let k=1;k<=6;k++){await page.mouse.move(a.x+off-40*k/6,a.y);await page.waitForTimeout(16);} 
        await page.mouse.up(); await page.waitForTimeout(60);
        const b = await pos();
        const movio = Math.abs(b.cx-a.cx)>1;
        console.log(`  agarre a ${off} px del centro (r visible ${a.w.toFixed(1)}px) -> ${movio?'ARRASTRA':'NO PASA NADA'}`);
        if(movio){ const c=await pos(); await page.mouse.move(c.x,c.y); await page.mouse.down(); for(let k=1;k<=6;k++){await page.mouse.move(c.x+40*k/6,c.y);await page.waitForTimeout(16);} await page.mouse.up(); await page.waitForTimeout(60);} 
      }
    } else if(MODO==='doble'){
      const p0=await punto();
      await page.mouse.move(p0.pantalla[0],p0.pantalla[1]); await page.mouse.down();
      await page.mouse.move(p0.pantalla[0]-60,p0.pantalla[1]+40); await page.mouse.up(); await page.waitForTimeout(100);
      const L0=(await log(page)).length;
      console.log('doble click en Listo:', await page.evaluate((s)=>{const b=document.querySelector(s); b.click(); const r1=b.disabled; b.click(); return 'disabled tras 1er click='+r1;}, sel+'button'));
      await page.waitForTimeout(2500);
      console.log('peticiones:', JSON.stringify((await log(page)).slice(L0).map(x=>x.url+' <- '+(x.req||'').slice(0,110)),null,1));
      console.log('mensajes', (await msgs(page)).slice(-2));
    }
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
