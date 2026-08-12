import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page} = await abrir();
await page.evaluate('window.__tutoria.practice.start(); 1');
const px=(x)=>62+(x/53.3333)*470, py=(y)=>396-(y/160)*362;
const NUM={q_cs_m_numeric:'150'};
const ctm = ()=>page.evaluate(()=>{const s=document.querySelector('svg.bgraph'); const m=s.getScreenCTM(); return {a:m.a,d:m.d,e:m.e,f:m.f};});
async function drag(m,from,to,pasos=10){
  const S=(x,y)=>[m.a*x+m.e, m.d*y+m.f];
  const f=S(...from), t=S(...to);
  await page.mouse.move(f[0],f[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){await page.mouse.move(f[0]+(t[0]-f[0])*i/pasos,f[1]+(t[1]-f[1])*i/pasos); await page.waitForTimeout(16);}
  await page.mouse.up(); await page.waitForTimeout(80);
}
async function ultQ(){const L=await log(page);const u=[...L].reverse().find(r=>r.url.includes('/next'));try{return JSON.parse(u.resp).question;}catch{return null;}}
const medir = ()=>page.evaluate(()=>{
  const de=document.scrollingElement;
  const body=document.querySelector('.dock-body');
  const b=document.querySelector('.dock .pregunta:last-child button');
  const svg=document.querySelector('svg.bgraph');
  const r=(e)=>{const x=e.getBoundingClientRect();return [Math.round(x.x),Math.round(x.y),Math.round(x.width),Math.round(x.height)];};
  return {scrollY:Math.round(de.scrollTop), pageH:de.scrollHeight, vh:innerHeight,
          dockBody:{sh:body.scrollHeight, ch:body.clientHeight, of:getComputedStyle(body).overflowY},
          boton:b?r(b):null, svg:r(svg)};
});
for(let i=0;i<7;i++){
  await page.waitForTimeout(600);
  const s=await qInfo(page); if(!s)break;
  const q=await ultQ(); const sel='.dock .pregunta:last-child ';
  await page.evaluate('document.scrollingElement.scrollTop=0');
  console.log(`#${i} ${q&&q.id}`, JSON.stringify(await medir()));
  if(s.cls.includes('q-manip')){
    const m=await ctm();
    if(q.id==='q_cs_m_manip'){await drag(m,[px(33.333),py(0)],[px(50),py(0)]);await drag(m,[px(0),py(100)],[px(0),py(150)]);}
    if(q.id==='q_cs_p_manip'){ await page.screenshot({path:SP+'manip-scroll-tope.png'}); await drag(m,[px(33.333),py(0)],[px(25),py(0)]); }
  }
  if(s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input',NUM[q.id]||'1');await page.click(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','x');await page.click(sel+'button[type=submit]');}
  else await page.click(sel+'button');
}
await browser.close();
