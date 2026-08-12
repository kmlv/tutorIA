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
    console.log('=== PUNTO', q.id, 'botones', JSON.stringify(s.btns));
    const nPreg0=await U.nPreg(); const L0=(await log(page)).length; const m0=(await msgs(page)).length;
    const btn = await page.evaluate((s)=>{const b=document.querySelector(s+'button'); const r=b.getBoundingClientRect();
      return {txt:b.textContent, dis:b.disabled, rect:[r.x+r.width/2,r.y+r.height/2]};}, sel);
    console.log('boton:', JSON.stringify(btn));
    await page.mouse.click(btn.rect[0], btn.rect[1]);   // CLICK REAL, sin tocar el punto
    await page.waitForTimeout(5000);
    console.log('tras clic REAL en Listo, sin haber tocado el punto:');
    console.log('  peticiones:', JSON.stringify((await log(page)).slice(L0).map(x=>x.url+' <- '+(x.req||'').slice(0,140)+' => '+(x.resp||'').slice(0,160))));
    console.log('  mensajes nuevos:', JSON.stringify((await msgs(page)).slice(m0)));
    console.log('  preguntas antes/despues:', nPreg0, await U.nPreg());
    console.log('  estado de la pregunta ahora:', JSON.stringify(await qInfo(page)));
    await page.screenshot({path:SP+'v-listo-sin-tocar.png', fullPage:false});
    // ahora si: mover con el teclado 1 paso y volver a pulsar Listo
    await page.keyboard.press('Tab');
    console.log('  foco tras Tab:', await page.evaluate(()=>{const a=document.activeElement;return a.tagName+'/'+(a.getAttribute('role')||'')+'/'+(a.getAttribute('class')||'');}));
    const L1=(await log(page)).length;
    await page.mouse.click(btn.rect[0]+250, btn.rect[1]); // clic en zona vacia del dock
    await page.waitForTimeout(500);
    console.log('  clic en el lienzo/dock vacio -> peticiones:', (await log(page)).slice(L1).length);
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
