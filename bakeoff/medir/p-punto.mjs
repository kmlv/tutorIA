import {abrir, qInfo, msgs} from './manip-lib.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page, red} = await abrir();
await page.evaluate('window.__tutoria.practice.start(); 1');
const map = await page.evaluate(()=>{const m=document.querySelector('svg.bgraph').getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
async function drag(from,to,pasos=10){
  await page.mouse.move(from[0],from[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos); await page.waitForTimeout(16);}
  await page.mouse.up(); await page.waitForTimeout(80);
}
const modo = ()=> {
  const ult = [...red].reverse().find(r=>r.resp && r.resp.includes('/next'));
  try { return JSON.parse(ult.t).question?.manip_modo; } catch { return null; }
};
for (let i=0;i<20;i++){
  await page.waitForTimeout(600);
  const s = await qInfo(page);
  if(!s){ console.log('sin pregunta'); break; }
  const sel='.dock .pregunta:last-child ';
  if (s.cls.includes('q-manip')){
    console.log(`#${i} MANIP modo=${modo()} :: ${s.enun} :: nota="${s.nota}"`);
    if (modo()==='point'){
      console.log('>>> ITEM DE PUNTO'); 
      console.log('capa manip:', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.capa-manip *')].map(e=>({t:e.tagName,c:e.getAttribute('class'),cx:e.getAttribute('cx'),cy:e.getAttribute('cy'),r:e.getAttribute('r'),fill:getComputedStyle(e).fill})))));
      await page.screenshot({path:SP+'manip-punto.png'});
      break;
    }
    // avanzar: mover un poco y confirmar
    await drag(S(355.75,396), S(400,396));
    await page.click(sel+'button');
  }
  else if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button:nth-child(2)'); // opcion equivocada
  else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input','7'); await page.click(sel+'button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','no se'); await page.click(sel+'button[type=submit]'); }
  else console.log('otra cosa', s.cls);
}
console.log(await msgs(page));
await browser.close();
