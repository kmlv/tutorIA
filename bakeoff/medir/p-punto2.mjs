import {abrir, qInfo, msgs} from './manip-lib.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page, red} = await abrir();
await page.evaluate('window.__tutoria.practice.start(); 1');
const map = await page.evaluate(()=>{const m=document.querySelector('svg.bgraph').getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
const NUM = {q_int_numeric_1:'100', q_int_numeric_2:'33.33', q_slope_numeric:'-3', q_eq_numeric:'64', q_cs_m_numeric:'150'};
async function drag(from,to,pasos=10){
  await page.mouse.move(from[0],from[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos); await page.waitForTimeout(16);}
  await page.mouse.up(); await page.waitForTimeout(80);
}
const ultNext = ()=>{ const u=[...red].reverse().find(r=>r.resp&&r.resp.includes('/next')); try{return JSON.parse(u.t).question;}catch{return null;} };
// px de un valor de x1 y de x2
const px = (x)=> 62 + (x/53.3333)*470;
const py = (y)=> 396 - (y/160)*362;
for (let i=0;i<24;i++){
  await page.waitForTimeout(550);
  const s = await qInfo(page); if(!s){console.log('sin pregunta');break;}
  const q = ultNext(); const sel='.dock .pregunta:last-child ';
  console.log(`#${i} ${q?.id} ${q?.modalidad}${q?.manip_modo?'/'+q.manip_modo:''}`);
  if (s.cls.includes('q-manip')){
    if (q.manip_modo==='point'){
      console.log('>>> ITEM DE PUNTO:', s.enun, '| nota:', s.nota);
      console.log('capa manip:', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.capa-manip *')].map(e=>({t:e.tagName,c:e.getAttribute('class'),cx:e.getAttribute('cx'),cy:e.getAttribute('cy'),r:e.getAttribute('r'),fill:getComputedStyle(e).fill})))));
      await page.screenshot({path:SP+'manip-punto.png'});
      break;
    }
    if (q.id==='q_cs_m_manip'){ await drag(S(px(33.333),py(0)),S(px(50),py(0))); await drag(S(px(0),py(100)),S(px(0),py(150))); }
    else if (q.id==='q_cs_p_manip'){ await drag(S(px(33.333),py(0)),S(px(25),py(0))); }
    await page.click(sel+'button');
  }
  else if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button:nth-child(1)');
  else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input', NUM[q.id]||'1'); await page.click(sel+'button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','La linea es la frontera del conjunto; el conjunto incluye canastas que no agotan el ingreso.'); await page.click(sel+'button[type=submit]'); }
}
console.log((await msgs(page)).slice(-6));
await browser.close();
