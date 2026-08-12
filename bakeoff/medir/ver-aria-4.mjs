import {abrir, hastaManip} from './manip-lib.mjs';
const {browser, page} = await abrir();
await hastaManip(page);
const map = await page.evaluate(()=>{const m=document.querySelector('svg.bgraph').getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
async function drag(from,to,p=14){await page.mouse.move(from[0],from[1]);await page.mouse.down();for(let i=1;i<=p;i++){await page.mouse.move(from[0]+(to[0]-from[0])*i/p,from[1]+(to[1]-from[1])*i/p);await page.waitForTimeout(16);}await page.mouse.up();await page.waitForTimeout(80);}
await drag(S(355.75,396), S(502.6,396));
await drag(S(62,169.75), S(62,56.6));
await page.waitForTimeout(200);
console.log(JSON.stringify(await page.evaluate(()=>{
  const p=[...document.querySelectorAll('.bands .price')][0];
  const chain=[]; let e=p;
  while(e && !e.classList.contains('bands')){const cs=getComputedStyle(e); const r=e.getBoundingClientRect();
    chain.push({tag:e.tagName, cls:e.getAttribute('class'), op:cs.opacity, vis:cs.visibility, h:Math.round(r.height), w:Math.round(r.width), ovf:cs.overflow, clip:cs.clipPath}); e=e.parentElement;}
  return {chain, rect:p.getBoundingClientRect().toJSON()};
}), null, 1));
// CDP: nombre accesible real del svg y del chip
const cdp = await page.context().newCDPSession(page);
await cdp.send('Accessibility.enable');
const {nodes} = await cdp.send('Accessibility.getFullAXTree');
const rel = nodes.filter(n => { const nm=(n.name&&n.name.value)||''; return /presupuestaria|\$3\/kg|\$1\/L|precio/i.test(nm); }).map(n=>({role:n.role&&n.role.value, name:(n.name&&n.name.value||'').slice(0,220), ignored:n.ignored}));
console.log('AX:', JSON.stringify(rel, null, 1));
const textos = nodes.filter(n=>n.role&&n.role.value==='StaticText'&&/\$3\/kg|\$1\/L/.test((n.name&&n.name.value)||'')).map(n=>({name:n.name.value, ignored:n.ignored}));
console.log('AX texto precios:', JSON.stringify(textos));
await browser.close();
