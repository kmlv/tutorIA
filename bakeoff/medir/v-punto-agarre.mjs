import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
const NUM={q_int_numeric_1:'100',q_int_numeric_2:'33.33',q_slope_numeric:'-3',q_eq_numeric:'64',q_cs_m_numeric:'150'};

const info = ()=>page.evaluate(()=>{
  const p=document.querySelector('.punto-manip'); const s=document.querySelector('svg.bgraph');
  if(!p) return null;
  const b=p.getBoundingClientRect(); const sb=s.getBoundingClientRect();
  const ctm=s.getScreenCTM();
  return {r:+p.getAttribute('r'), cx:+p.getAttribute('cx'), cy:+p.getAttribute('cy'),
    anchoPantalla:b.width, altoPantalla:b.height,
    centro:[b.x+b.width/2, b.y+b.height/2], escala:ctm.a,
    aria:s.getAttribute('aria-label'),
    capa:document.querySelector('.capa-manip').innerHTML.replace(/\s+/g,' ').slice(0,600),
    cursor:getComputedStyle(p).cursor, svgRect:[sb.x,sb.y,sb.width,sb.height]};
});

let items=0;
for(let i=0;i<26;i++){
  const n=await U.nPreg();
  if(!await U.esperarNueva(n-1,20000)){console.log('sin nueva pregunta');break;}
  await page.waitForTimeout(400);
  items++;
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip') && q && q.manip_modo==='point'){
    console.log('=== ITEM #'+items+' id='+q.id+' modo=point');
    console.log('enunciado:', s.enun);
    await page.evaluate('document.scrollingElement.scrollTop=0');
    await page.waitForTimeout(200);
    const I0 = await info();
    console.log('INICIAL:', JSON.stringify(I0,null,1));
    console.log('estado grafico:', JSON.stringify(await page.evaluate('window.__tutoria.estado()')));
    await page.screenshot({path:SP+'v-punto-inicial.png'});

    // hover a distintas distancias: cursor y elemento bajo el raton
    for (const off of [0,4,6,7,8,10,12,16,20,22,26]){
      const a = await info();
      const r = await page.evaluate(([x,y])=>{
        const e=document.elementFromPoint(x,y);
        return {tag:e?e.tagName:'null', cls:e?(e.getAttribute('class')||''):'', cursor:e?getComputedStyle(e).cursor:''};
      }, [a.centro[0]+off, a.centro[1]]);
      await page.mouse.move(a.centro[0]+off, a.centro[1]);
      await page.waitForTimeout(90);
      const capaDespues = await page.evaluate(()=>document.querySelector('.capa-manip').innerHTML.replace(/\s+/g,' '));
      // arrastre real
      const antesMsgs=(await msgs(page)).length;
      await page.mouse.down();
      for(let k=1;k<=8;k++){await page.mouse.move(a.centro[0]+off-48*k/8, a.centro[1]-30*k/8);await page.waitForTimeout(16);}
      await page.mouse.up(); await page.waitForTimeout(120);
      const b = await info();
      const movio = Math.abs(b.cx-a.cx)>1 || Math.abs(b.cy-a.cy)>1;
      const nuevosMsgs=(await msgs(page)).length-antesMsgs;
      console.log(`  off=${String(off).padStart(2)}px  elemBajoRaton=${r.tag}.${r.cls} cursor=${r.cursor}  ->  ${movio?'ARRASTRA':'NADA'}  (dcx=${(b.cx-a.cx).toFixed(1)}, dcy=${(b.cy-a.cy).toFixed(1)}, msgsNuevos=${nuevosMsgs}, aria="${b.aria}")`);
      if(movio){ // devolver al sitio
        const c=await info();
        await page.mouse.move(c.centro[0],c.centro[1]); await page.mouse.down();
        await page.mouse.move(I0.centro[0], I0.centro[1], {steps:8});
        await page.mouse.up(); await page.waitForTimeout(100);
      }
    }
    console.log('FINAL:', JSON.stringify(await info()));
    console.log('mensajes dock:', await msgs(page));
    await page.screenshot({path:SP+'v-punto-final.png'});
    break;
  }
  console.log('item #'+items+' '+(q?q.id:'?')+' ('+s.cls+')');
  if(s.cls.includes('q-manip')){
    const {px,py}=await import('./runner.mjs');
    if(q.id==='q_cs_m_manip'){await U.dragSvg([px(33.333),py(0)],[px(50),py(0)]);await U.dragSvg([px(0),py(100)],[px(0),py(150)]);}
    if(q.id==='q_cs_p_manip'){await U.dragSvg([px(33.333),py(0)],[px(25),py(0)]);}
    await U.clickJS(sel+'button:not([disabled])');
  }
  else if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input',NUM[q.id]||'1');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','La linea es la frontera del conjunto presupuestario.');await U.clickJS(sel+'button[type=submit]');}
}
await browser.close();
