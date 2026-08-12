import {abrir, qInfo} from './manip-lib.mjs';
const SS='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page} = await abrir({lang:'es'});
// Servimos q_feas_manip (modo punto) porque el selector real no lo alcanza en esta sesion.
// El resto del camino es la app tal cual: el mismo askManip, el mismo enableDrag.
await page.route('**/next', async route => {
  const res = await route.fetch(); const j = await res.json();
  if (j.question) { j.question = {id:'q_feas_manip', modalidad:'manip',
    enunciado:'Arrastra el punto hasta una canasta que puedas pagar SIN gastar todo tu ingreso.',
    opciones:null, manip_modo:'point'}; }
  await route.fulfill({response: res, body: JSON.stringify(j)});
});
await page.evaluate('window.__tutoria.practice.start(); 1');
for(let i=0;i<10;i++){ await page.waitForTimeout(400); const s=await qInfo(page); if(s && s.cls.includes('q-manip')){ console.log('MANIP:', s.enun,'|',s.nota); break; } }
const p0 = await page.evaluate(()=>{const c=document.querySelector('.punto-manip'); if(!c) return null;
  const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(c.ownerSVGElement.getScreenCTM());
  return {cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy'),sx:p.x,sy:p.y, aria:c.ownerSVGElement.getAttribute('aria-label')};});
console.log('punto ANTES:', JSON.stringify(p0));
await page.screenshot({path:SS+'tope-P-antes.png'});
await page.mouse.move(p0.sx,p0.sy); await page.mouse.down();
for (const q of [[700,700],[1000,800],[1279,859]]) { await page.mouse.move(q[0],q[1],{steps:5}); await page.waitForTimeout(60);}
await page.mouse.up(); await page.waitForTimeout(250);
const d = await page.evaluate(()=>{const c=document.querySelector('.punto-manip'); const svg=c.ownerSVGElement;
  const p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(svg.getScreenCTM());
  const el=document.elementFromPoint(Math.min(p.x,innerWidth-1),Math.min(p.y,innerHeight-1));
  const r=svg.getBoundingClientRect();
  return {cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy'),sx:p.x,sy:p.y, viewBox:svg.getAttribute('viewBox'),
    dentro: p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom,
    el: el?el.tagName+'.'+(el.className.baseVal??el.className):null, aria:svg.getAttribute('aria-label')};});
console.log('punto DESPUES:', JSON.stringify(d,null,1));
await page.screenshot({path:SS+'tope-P-fuera.png'});
await page.mouse.move(p0.sx,p0.sy); await page.mouse.down(); await page.mouse.move(p0.sx-60,p0.sy,{steps:4}); await page.mouse.up(); await page.waitForTimeout(200);
console.log('tras arrastrar donde estaba:', await page.evaluate(()=>{const c=document.querySelector('.punto-manip');return c.getAttribute('cx')+','+c.getAttribute('cy');}));
await page.mouse.dblclick(p0.sx,p0.sy); await page.waitForTimeout(200);
console.log('tras dblclick:', await page.evaluate(()=>{const c=document.querySelector('.punto-manip');return c.getAttribute('cx')+','+c.getAttribute('cy');}));
console.log('foco:', await page.evaluate(()=>document.activeElement.tagName+' role='+document.activeElement.getAttribute('role')));
await browser.close();
