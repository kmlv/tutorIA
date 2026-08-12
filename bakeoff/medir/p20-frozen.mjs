import {open} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const {browser, page} = await open('http://localhost:57330/?lang=es');
await page.evaluate(()=>{window.__tutoria.media.seek(60);});
await page.click('#ask'); await page.waitForTimeout(600);
for (let i=1;i<=13;i++){
  await page.fill('.composer-input','q'+i);
  await page.evaluate(()=>document.querySelector('.composer').requestSubmit());
  await page.waitForTimeout(5200);
}
const s = await page.evaluate(()=>{
  const f=document.querySelector('.composer'), b=document.querySelector('.composer-enviar'), i=document.querySelector('.composer-input');
  const cf=getComputedStyle(f), cb=getComputedStyle(b), ci=getComputedStyle(i);
  const r=b.getBoundingClientRect();
  return {agotado:f.dataset.agotado, formPE:cf.pointerEvents, formOp:cf.opacity,
    btn:{txt:b.textContent.trim(), bg:cb.backgroundColor, op:cb.opacity, pe:cb.pointerEvents, cursor:cb.cursor, disabled:b.disabled},
    inp:{ph:i.placeholder, pe:ci.pointerEvents, disabled:i.disabled, bg:ci.backgroundColor, op:ci.opacity},
    enCentroBoton:(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)||{}).className,
    avisoVisible:[...document.querySelectorAll('.dock *')].map(e=>e.textContent.trim()).filter(t=>/pregunta/i.test(t)&&t.length<40).slice(-3)};
});
console.log('COMPOSER CONGELADO:', JSON.stringify(s,null,1));
const n0 = await page.evaluate(()=>document.querySelectorAll('.dock .msg').length);
const r = await page.evaluate(()=>{const b=document.querySelector('.composer-enviar').getBoundingClientRect(); return {x:b.left+b.width/2,y:b.top+b.height/2};});
await page.mouse.click(r.x, r.y);
await page.waitForTimeout(1500);
const ri = await page.evaluate(()=>{const b=document.querySelector('.composer-input').getBoundingClientRect(); return {x:b.left+b.width/2,y:b.top+b.height/2};});
await page.mouse.click(ri.x, ri.y);
await page.keyboard.type('hola?');
await page.waitForTimeout(1500);
const after = await page.evaluate(()=>({n:document.querySelectorAll('.dock .msg').length, val:document.querySelector('.composer-input').value, focus:document.activeElement.className}));
console.log(`clic real + teclear: msgs ${n0} -> ${after.n}; valor del campo="${after.val}"; foco=${after.focus}`);
await page.screenshot({path:SHOT+'composer-congelado.png'});
await browser.close();
