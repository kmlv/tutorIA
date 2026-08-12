import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page} = await abrir();
await page.evaluate('window.__tutoria.practice.start(); 1');
const ctm = ()=>page.evaluate(()=>{const s=document.querySelector('svg.bgraph'); const m=s.getScreenCTM(); const b=s.getBoundingClientRect(); return {a:m.a,d:m.d,e:m.e,f:m.f, rect:[b.x,b.y,b.width,b.height]};});
const px=(x)=>62+(x/53.3333)*470, py=(y)=>396-(y/160)*362;
const NUM={q_cs_m_numeric:'150'};
async function drag(page,m,from,to,pasos=10){
  const S=(x,y)=>[m.a*x+m.e, m.d*y+m.f];
  const f=S(...from), t=S(...to);
  await page.mouse.move(f[0],f[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){await page.mouse.move(f[0]+(t[0]-f[0])*i/pasos,f[1]+(t[1]-f[1])*i/pasos); await page.waitForTimeout(16);}
  await page.mouse.up(); await page.waitForTimeout(80);
}
async function ultQ(){const L=await log(page);const u=[...L].reverse().find(r=>r.url.includes('/next'));try{return JSON.parse(u.resp).question;}catch{return null;}}
for(let i=0;i<8;i++){
  await page.waitForTimeout(550);
  const s=await qInfo(page); if(!s)break;
  const q=await ultQ(); const sel='.dock .pregunta:last-child ';
  if(s.cls.includes('q-manip')){
    const m = await ctm();
    console.log(q.id, 'CTM', JSON.stringify(m));
    console.log('  elementFromPoint en tirador X:', await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); let p=e,ch=[]; while(p&&ch.length<4){ch.push(p.tagName+'.'+(p.getAttribute&&p.getAttribute('class')||''));p=p.parentElement;} return ch.join(' < ');}, [m.a*px(33.333)+m.e, m.d*py(0)+m.f]));
    if(q.id==='q_cs_p_manip'){
      await drag(page,m,[px(33.333),py(0)],[px(25),py(0)]);
      console.log('  tras drag', await page.evaluate(()=>[...document.querySelectorAll('.capa-manip .tirador')].map(t=>[+t.getAttribute('cx'),+t.getAttribute('cy')])));
      await page.screenshot({path:SP+'manip-csp2.png'});
      await page.click(sel+'button'); await page.waitForTimeout(1500);
      const L=await log(page); console.log('  ANSWER', JSON.stringify(L.filter(r=>r.url.includes('answer')).slice(-1)));
      console.log('  MSG', (await msgs(page)).slice(-1));
      break;
    }
    if(q.id==='q_cs_m_manip'){await drag(page,m,[px(33.333),py(0)],[px(50),py(0)]);await drag(page,m,[px(0),py(100)],[px(0),py(150)]);}
    await page.click(sel+'button');
  }
  else if(s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button:nth-child(1)');
  else if(s.cls.includes('q-numeric')){await page.fill(sel+'.q-input',NUM[q.id]||'1');await page.click(sel+'button[type=submit]');}
  else if(s.cls.includes('q-open')){await page.fill(sel+'.q-textarea','x');await page.click(sel+'button[type=submit]');}
}
await browser.close();
