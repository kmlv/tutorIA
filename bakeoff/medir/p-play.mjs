import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
import {util, SP, px, py} from './runner.mjs';
const {browser,page}=await abrir();
const U=util(page);
await page.evaluate('window.__tutoria.practice.start(); 1');
const foto = async(etq)=>console.log(etq, JSON.stringify(await page.evaluate(()=>{
  const svg=document.querySelector('svg.bgraph');
  const l=svg.querySelector('.capa-linea .recta.linea');
  return {
    hayLinea: !!l, linea: l?[l.getAttribute('x1'),l.getAttribute('y1'),l.getAttribute('x2'),l.getAttribute('y2')].map(v=>Math.round(+v)):null,
    tiradores: [...svg.querySelectorAll('.capa-manip .tirador')].map(t=>[Math.round(+t.getAttribute('cx')),Math.round(+t.getAttribute('cy'))]),
    dock: document.querySelector('.dock').dataset.estado,
    dockVisible: getComputedStyle(document.querySelector('.dock')).display,
    pregVisible: (()=>{const p=document.querySelector('.dock .pregunta:last-child'); if(!p) return null; const r=p.getBoundingClientRect(); return {y:Math.round(r.y),h:Math.round(r.height),disp:getComputedStyle(p).display};})(),
    play: document.getElementById('play').textContent, reloj: document.getElementById('reloj').textContent,
  };})));
for(let i=0;i<6;i++){
  const n=await U.nPreg(); if(!await U.esperarNueva(n-1,15000))break;
  await page.waitForTimeout(400);
  const s=await qInfo(page); const q=await U.ultQ(); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip')){
    console.log('== item manip:', q.id, s.enun);
    await U.dragSvg([px(33.333),py(0)],[px(50),py(0)]);
    await foto('antes de pulsar Empezar:');
    await page.evaluate('document.getElementById("play").click()');
    await page.waitForTimeout(3000);
    await foto('3 s de reproduccion:');
    await page.evaluate('document.scrollingElement.scrollTop=0');
    await page.screenshot({path:SP+'manip-tras-play.png'});
    await page.waitForTimeout(4000);
    await foto('7 s de reproduccion:');
    // el alumno sigue e intenta confirmar
    const L0=(await log(page)).length;
    console.log('click Listo:', await U.clickJS(sel+'button:not([disabled])'));
    await page.waitForTimeout(2000);
    console.log('peticiones:', JSON.stringify((await log(page)).slice(L0).map(x=>x.url+' <- '+(x.req||'').slice(0,110)+' => '+(x.resp||'').slice(0,90))));
    console.log('mensajes', (await msgs(page)).slice(-2));
    break;
  }
  if(s.cls.includes('q-mcq')) await U.clickJS(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input','1');await U.clickJS(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','x');await U.clickJS(sel+'button[type=submit]');}
}
await browser.close();
