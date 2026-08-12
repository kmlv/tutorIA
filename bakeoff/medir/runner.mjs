import {abrir, qInfo, msgs, log} from './manip-lib2.mjs';
export const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
export const px=(x)=>62+(x/53.3333)*470, py=(y)=>396-(y/160)*362;
export function util(page){
  const ctm = ()=>page.evaluate(()=>{const s=document.querySelector('svg.bgraph');const m=s.getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
  const nPreg = ()=>page.evaluate(()=>document.querySelectorAll('.dock .pregunta').length);
  const ultQ = async()=>{const L=await log(page);const u=[...L].reverse().find(r=>r.url.includes('/next'));try{return JSON.parse(u.resp).question;}catch{return null;}};
  const clickJS = (sel)=>page.evaluate((s)=>{const b=document.querySelector(s); if(!b) return 'no existe'; b.click(); return 'ok';}, sel);
  async function dragSvg(from,to,pasos=12){
    const m=await ctm(); const S=(x,y)=>[m.a*x+m.e,m.d*y+m.f];
    const f=S(...from),t=S(...to);
    await page.mouse.move(f[0],f[1]); await page.mouse.down();
    for(let i=1;i<=pasos;i++){await page.mouse.move(f[0]+(t[0]-f[0])*i/pasos,f[1]+(t[1]-f[1])*i/pasos);await page.waitForTimeout(16);}
    await page.mouse.up(); await page.waitForTimeout(80);
  }
  async function esperarNueva(n, ms=15000){
    const t0=Date.now();
    while(Date.now()-t0<ms){ if(await nPreg()>n) return true; await page.waitForTimeout(200); }
    return false;
  }
  return {ctm,nPreg,ultQ,clickJS,dragSvg,esperarNueva};
}
