import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
// ---- V1: la clase "elegida" no cambia nada visualmente
{
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
  await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button').length>0,null,{timeout:25000});
  await page.waitForTimeout(400);
  await page.click('.q-opciones button:nth-child(3)'); // MAL a proposito
  await page.waitForTimeout(1500);
  const v = await page.evaluate(()=>[...document.querySelectorAll('.q-opciones button')].map((b,i)=>{
    const cs=getComputedStyle(b), be=getComputedStyle(b,'::before'), af=getComputedStyle(b,'::after');
    return {i, cls:b.className, bg:cs.backgroundColor, bd:cs.border, sh:cs.boxShadow, out:cs.outline, op:cs.opacity,
      before:be.content, after:af.content, td:cs.textDecorationLine};
  }));
  console.log('V1 estilos tras elegir la opcion 3 (incorrecta):');
  console.log(JSON.stringify(v,null,1));
  const identicos = v.every(x=>x.bg===v[0].bg && x.bd===v[0].bd && x.sh===v[0].sh && x.op===v[0].op && x.before===v[0].before && x.after===v[0].after);
  console.log('  >> las 4 opciones se ven IDENTICAS:', identicos);
  await page.screenshot({path:SHOT+'v1-elegida.png', clip:{x:900,y:60,width:380,height:320}});
  await browser.close();
}
// ---- V2: boton Preguntar a cuota 0: clic real de raton vs Enter
{
  const {browser, page} = await open('http://localhost:57330/?lang=es');
  await page.evaluate(()=>{window.__tutoria.media.seek(60);});
  await page.click('#ask'); await page.waitForTimeout(600);
  for (let i=1;i<=12;i++){
    await page.fill('.composer-input','q'+i);
    await page.evaluate(()=>document.querySelector('.composer').requestSubmit());
    await page.waitForTimeout(5200);
  }
  const cont = await page.evaluate(()=>[...document.querySelectorAll('.dock *')].map(e=>e.textContent.trim()).filter(t=>/^\d+ pregunta/.test(t)).pop());
  console.log('\nV2 contador tras 12:', cont);
  const look = await page.evaluate(()=>{const b=document.querySelector('.composer-enviar'),i=document.querySelector('.composer-input');
    const cs=getComputedStyle(b); return {txt:b.textContent.trim(), bg:cs.backgroundColor, op:cs.opacity, pe:cs.pointerEvents, cursor:cs.cursor, disabled:b.disabled, ph:i.placeholder, inpPe:getComputedStyle(i).pointerEvents, inpDis:i.disabled};});
  console.log('V2 aspecto del boton a cuota 0:', JSON.stringify(look));
  const nBefore = await page.evaluate(()=>document.querySelectorAll('.dock .msg').length);
  await page.fill('.composer-input','ayuda, no lo entiendo');
  const r = await page.evaluate(()=>{const b=document.querySelector('.composer-enviar').getBoundingClientRect(); return {x:b.left+b.width/2,y:b.top+b.height/2};});
  await page.mouse.click(r.x, r.y);
  await page.waitForTimeout(7000);
  const nAfterClick = await page.evaluate(()=>document.querySelectorAll('.dock .msg').length);
  console.log(`V2 clic REAL de raton en "Preguntar": mensajes ${nBefore} -> ${nAfterClick}  (sin efecto: ${nBefore===nAfterClick})`);
  await page.click('.composer-input');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(7000);
  const nAfterEnter = await page.evaluate(()=>document.querySelectorAll('.dock .msg').length);
  console.log(`V2 con Enter: mensajes ${nAfterClick} -> ${nAfterEnter}`);
  console.log('V2 ultimos:', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].slice(-2).map(m=>m.className+' :: '+m.textContent.trim().slice(0,110)))));
  await page.screenshot({path:SHOT+'v2-cuota0.png'});
  await browser.close();
}
