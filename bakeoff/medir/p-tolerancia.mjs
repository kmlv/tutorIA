import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
const NUM={q_cs_m_numeric:'150'};
async function tirar(desdePantalla, dx, dy){
  await page.mouse.move(desdePantalla[0],desdePantalla[1]); await page.mouse.down();
  for(let k=1;k<=6;k++){await page.mouse.move(desdePantalla[0]+dx*k/6, desdePantalla[1]+dy*k/6); await page.waitForTimeout(16);} 
  await page.mouse.up(); await page.waitForTimeout(60);
}
for(let i=0;i<24;i++){
  const n=await U.nPreg(); if(!await U.esperarNueva(n-1,15000))break;
  await page.waitForTimeout(300);
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip')){
    await page.evaluate('document.scrollingElement.scrollTop=0');
    if(q.manip_modo==='point'){
      const p = await page.evaluate(()=>{const c=document.querySelector('.punto-manip');const b=c.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,w:b.width};});
      console.log('PUNTO en pantalla', p);
      for (const off of [0, 8, 10, 12, 16, 22, 30]){
        const antes = await page.evaluate(()=>+document.querySelector('.punto-manip').getAttribute('cx'));
        await tirar([p.x+off, p.y], -40, 0);
        const desp = await page.evaluate(()=>+document.querySelector('.punto-manip').getAttribute('cx'));
        console.log(`  agarre a ${off} px del centro -> ${Math.abs(desp-antes)>1?'ARRASTRA':'NO PASA NADA'}`);
        if (Math.abs(desp-antes)>1) await tirar([p.x-40+off,p.y],40,0); // devolverlo
      }
      break;
    }
    // tolerancia del tirador de la recta (r=20)
    const t = await page.evaluate(()=>{const c=[...document.querySelectorAll('.capa-manip .tirador')][0];const b=c.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,w:b.width};});
    console.log('TIRADOR recta en pantalla', t);
    for (const off of [0, 15, 20, 25, 30]){
      const antes = await page.evaluate(()=>+document.querySelectorAll('.capa-manip .tirador')[0].getAttribute('cx'));
      await tirar([t.x, t.y-off], 30, 0);
      const desp = await page.evaluate(()=>+document.querySelectorAll('.capa-manip .tirador')[0].getAttribute('cx'));
      console.log(`  agarre a ${off} px por encima -> ${Math.abs(desp-antes)>1?'ARRASTRA':'NO PASA NADA'}`);
      if (Math.abs(desp-antes)>1) await tirar([t.x+30,t.y-off],-30,0);
    }
    await U.clickJS(sel+'button:not([disabled])');
    continue;
  }
  if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input',NUM[q.id]||'1');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','La linea es la frontera del conjunto.');await U.clickJS(sel+'button[type=submit]');}
}
await browser.close();
