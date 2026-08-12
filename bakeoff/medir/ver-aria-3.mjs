import {abrir, hastaManip} from './manip-lib.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page} = await abrir();
await hastaManip(page);
const map = await page.evaluate(()=>{const m=document.querySelector('svg.bgraph').getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
async function drag(from,to,p=14){await page.mouse.move(from[0],from[1]);await page.mouse.down();for(let i=1;i<=p;i++){await page.mouse.move(from[0]+(to[0]-from[0])*i/p,from[1]+(to[1]-from[1])*i/p);await page.waitForTimeout(16);}await page.mouse.up();await page.waitForTimeout(80);}
await drag(S(355.75,396), S(502.6,396));
await drag(S(62,169.75), S(62,56.6));
await page.waitForTimeout(200);
// que ve realmente un lector de pantalla en la banda?
const info = await page.evaluate(()=>{
  const out=[];
  document.querySelectorAll('.bands *').forEach(e=>{
    const t=(e.textContent||'').trim();
    if(!t || t.length>40 || e.children.length) return;
    const cs=getComputedStyle(e);
    out.push({txt:t, cls:e.getAttribute('class'), op:cs.opacity, vis:cs.visibility, disp:cs.display, ariaHidden:e.closest('[aria-hidden="true"]')?'SI':'no'});
  });
  return out;
});
console.log('BANDA elementos:', JSON.stringify(info.filter(x=>/\$|precio|kg|L/.test(x.txt)), null, 1));
const snap = await page.accessibility.snapshot({interestingOnly:false});
function buscar(n, out=[]){ if(!n) return out; if(n.role==='img'||/presupuestaria|precio|\$/.test(n.name||'')) out.push({role:n.role,name:n.name}); (n.children||[]).forEach(c=>buscar(c,out)); return out; }
console.log('A11Y TREE (nodos relevantes):', JSON.stringify(buscar(snap), null, 1));
await browser.close();
