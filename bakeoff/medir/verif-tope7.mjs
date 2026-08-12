import {abrir, qInfo} from './manip-lib.mjs';
const SS='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page} = await abrir({lang:'es'});
page.on('response', async r => { if (r.url().includes('/next')) { try { const j=await r.json();
  console.log('   [next]', j.question? j.question.id+' modo='+(j.question.manip_modo??'-') : 'done='+j.done); } catch{} }});
await page.evaluate('window.__tutoria.practice.start(); 1');
const sel = '.dock .pregunta:last-child ';
let s=null, hallado=false;
for (let i=0;i<30;i++){ await page.waitForTimeout(500); s=await qInfo(page); if(!s) continue;
  if (s.cls.includes('q-manip')) {
    if ((s.nota||'').includes('punto')) { hallado=true; console.log('>> MANIP DE PUNTO:', s.enun); break; }
    // arrastrar el tirador vertical un poco (valor no nulo) y confirmar
    const t = await page.evaluate(()=>{const c=[...document.querySelectorAll('.capa-manip circle')][3];
      const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.ownerSVGElement.getScreenCTM());return {x:p.x,y:p.y};});
    await page.mouse.move(t.x,t.y); await page.mouse.down(); await page.mouse.move(t.x,t.y-63,{steps:6}); await page.mouse.up();
    await page.waitForTimeout(200); await page.click(sel+'button'); continue;
  }
  if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button');
  else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input','150'); await page.click(sel+'button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','la linea es la frontera del conjunto, el conjunto incluye canastas que no agotan el ingreso'); await page.click(sel+'button[type=submit]'); } }
if (!hallado) { console.log('FIN sin manip de punto. ultima:', JSON.stringify(s)); await browser.close(); process.exit(0); }
const p0 = await page.evaluate(()=>{const c=document.querySelector('.punto-manip');
  const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.ownerSVGElement.getScreenCTM());
  return {cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy'),sx:p.x,sy:p.y};});
console.log('punto ANTES:', JSON.stringify(p0));
await page.mouse.move(p0.sx,p0.sy); await page.mouse.down();
for (const q of [[700,700],[1000,800],[1279,859]]) { await page.mouse.move(q[0],q[1],{steps:5}); await page.waitForTimeout(60);}
await page.mouse.up(); await page.waitForTimeout(250);
console.log('punto DESPUES:', JSON.stringify(await page.evaluate(()=>{const c=document.querySelector('.punto-manip');
  const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.ownerSVGElement.getScreenCTM());
  const el=document.elementFromPoint(Math.min(p.x,innerWidth-1),Math.min(p.y,innerHeight-1));
  return {cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy'),sx:p.x,sy:p.y,el:el?el.tagName+'.'+(el.className.baseVal??el.className):null,
   aria:c.ownerSVGElement.getAttribute('aria-label')};})));
await page.screenshot({path:SS+'tope-P-fuera.png'});
await page.mouse.move(p0.sx,p0.sy); await page.mouse.down(); await page.mouse.move(p0.sx-50,p0.sy,{steps:3}); await page.mouse.up(); await page.waitForTimeout(200);
console.log('tras clicar/arrastrar donde estaba el punto:', await page.evaluate(()=>{const c=document.querySelector('.punto-manip');return c.getAttribute('cx')+','+c.getAttribute('cy');}));
await browser.close();
