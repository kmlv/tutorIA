import {open} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const probe = () => page.evaluate(()=>{
  const b=document.querySelector('.composer-enviar'); const r=b.getBoundingClientRect();
  const cx=r.left+r.width/2, cy=r.top+r.height/2;
  const top=document.elementFromPoint(cx,cy);
  const i=document.querySelector('.composer-input'); const ri=i.getBoundingClientRect();
  const topI=document.elementFromPoint(ri.left+ri.width/2, ri.top+ri.height/2);
  return {btnRect:{x:+r.x.toFixed(0),y:+r.y.toFixed(0),w:+r.width.toFixed(0),h:+r.height.toFixed(0)},
    elementoEnElCentroDelBoton: top? top.className+'<'+top.tagName+'>' : null,
    elementoEnElCentroDelInput: topI? topI.className+'<'+topI.tagName+'>' : null,
    viewportH: innerHeight, dockScroll: (()=>{const d=document.querySelector('.dock'); return {sh:d.scrollHeight, ch:d.clientHeight};})()};
});
const {browser, page: page_} = await open('http://localhost:57330/?lang=es');
globalThis.page = page_;
await page.evaluate(()=>{window.__tutoria.media.seek(60);});
await page.click('#ask'); await page.waitForTimeout(600);
console.log('inicial:', JSON.stringify(await probe()));
const contador = () => page.evaluate(()=>[...document.querySelectorAll('.dock *')].map(e=>e.textContent.trim()).filter(t=>/^\d+ pregunta/.test(t)).pop()||'(sin contador)');
for (let i=1;i<=14;i++){
  await page.fill('.composer-input','pregunta '+i);
  let ok=true;
  try { await page.click('.composer-enviar', {timeout:4000}); }
  catch(e){ ok=false; console.log(`\n!! pregunta ${i}: EL BOTON PREGUNTAR NO SE PUEDE PULSAR`); console.log('   probe:', JSON.stringify(await probe(),null,1)); }
  if(!ok){ await page.screenshot({path:SHOT+'composer-bloqueado.png'}); break; }
  await page.waitForTimeout(6500);
  console.log(`pregunta ${i}: contador=${await contador()} | probe=${JSON.stringify(await probe())}`);
}
await browser.close();
