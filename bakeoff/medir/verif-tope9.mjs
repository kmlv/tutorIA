import {abrir, qInfo} from './manip-lib.mjs';
const {browser, page} = await abrir({lang:'es'});
page.on('request', r=>{ if(r.url().includes('/answer')) console.log('   [answer REQ]', r.postData()); });
page.on('response', async r=>{ if(r.url().includes('/answer')) { try{ console.log('   [answer RES]', (await r.text()).slice(0,300)); }catch{} }});
await page.evaluate('window.__tutoria.practice.start(); 1');
const sel='.dock .pregunta:last-child ';
for(let i=0;i<8;i++){ await page.waitForTimeout(500); const s=await qInfo(page); if(!s) continue;
  if(s.cls.includes('q-manip')) break;
  if(s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button'); }
// llevar el intercepto vertical exactamente a 150 usando las coordenadas del propio grafico
const e = await page.evaluate(()=>{ const svg=document.querySelector('.capa-manip').ownerSVGElement; const m=svg.getScreenCTM();
  const cs=[...document.querySelectorAll('.capa-manip circle')];
  const hy=cs[3]; const p=new DOMPoint(+hy.getAttribute('cx'),+hy.getAttribute('cy')).matrixTransform(m);
  // origen: cy del hitX
  const oy=+cs[1].getAttribute('cy'); const cyAhora=+hy.getAttribute('cy');
  const pxPorUnidad=(oy-cyAhora)/100;             // 100 = intercepto actual
  const cyObjetivo=oy-150*pxPorUnidad;
  const q=new DOMPoint(+hy.getAttribute('cx'), cyObjetivo).matrixTransform(m);
  return {desde:{x:p.x,y:p.y}, hasta:{x:q.x,y:q.y}};});
console.log('arrastro de', JSON.stringify(e.desde), 'a', JSON.stringify(e.hasta));
await page.mouse.move(e.desde.x,e.desde.y); await page.mouse.down();
await page.mouse.move(e.hasta.x,e.hasta.y,{steps:10}); await page.mouse.up(); await page.waitForTimeout(250);
console.log('textos intercepto tras arrastrar:', await page.evaluate(()=>[...document.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent)));
await page.click(sel+'button'); await page.waitForTimeout(2500);
console.log('msgs:', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].map(m=>m.textContent).slice(-3))));
console.log('siguiente:', JSON.stringify(await qInfo(page)));
await browser.close();
