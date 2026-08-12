import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const {browser, page} = await open('http://localhost:57330/?lang=es');
await page.evaluate(()=>{window.__tutoria.media.seek(60);});
await page.click('#ask'); await page.waitForTimeout(600);
const st = () => page.evaluate(()=>{
  const i=document.querySelector('.composer-input'), b=document.querySelector('.composer-enviar'), f=document.querySelector('.composer');
  const r=b.getBoundingClientRect();
  return {contador:[...document.querySelectorAll('.dock *')].map(e=>e.textContent.trim()).filter(t=>/^\d+ pregunta/.test(t)).pop()||null,
    inpDisabled:i.disabled, ph:i.placeholder, btnDisabled:b.disabled, btnTxt:b.textContent.trim(),
    peForm:getComputedStyle(f).pointerEvents, peBtn:getComputedStyle(b).pointerEvents, opForm:getComputedStyle(f).opacity,
    clsForm:f.className, enCentro:(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)||{}).className,
    nMsgTutor:document.querySelectorAll('.dock .msg.tutor').length, nMsgEst:document.querySelectorAll('.dock .msg.estudiante').length};
});
for (let i=1;i<=13;i++){
  await page.fill('.composer-input','pregunta '+i);
  await page.evaluate(()=>{const f=document.querySelector('.composer'); f.requestSubmit ? f.requestSubmit() : document.querySelector('.composer-enviar').click();});
  await page.waitForTimeout(6500);
  const s = await st();
  console.log(`p${i}: ${s.contador} | tutor=${s.nMsgTutor} est=${s.nMsgEst} | inpDis=${s.inpDisabled} btnDis=${s.btnDisabled} peForm=${s.peForm} clsForm="${s.clsForm}" ph="${s.ph}"`);
}
console.log('\nESTADO FINAL COMPOSER:', JSON.stringify(await st(),null,1));
await page.screenshot({path:SHOT+'cuota0.png'});
// ir a cp1 y fallar
await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button:not([disabled])').length>0, null, {timeout:25000});
await page.waitForTimeout(600);
await page.click('.q-opciones button:nth-child(2)');
await page.waitForTimeout(2500);
console.log('\n=== CP1 TRAS FALLAR CON CUOTA 0 ===');
console.log(JSON.stringify(await page.evaluate(()=>({
  opciones:[...document.querySelectorAll('.q-opciones button')].map(b=>b.disabled),
  composer:(()=>{const i=document.querySelector('.composer-input'),b=document.querySelector('.composer-enviar'),f=document.querySelector('.composer');
    const r=b.getBoundingClientRect(); return {inpDisabled:i.disabled, btnDisabled:b.disabled, pe:getComputedStyle(f).pointerEvents, enCentro:(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)||{}).className};})(),
  ultimos:[...document.querySelectorAll('.dock .msg')].slice(-4).map(m=>m.className+' :: '+m.textContent.trim().slice(0,90)),
})),null,1));
// intentar preguntar
await page.fill('.composer-input','no entiendo, cual era la respuesta?').catch(e=>console.log('  no se puede escribir:',String(e).slice(0,80)));
await page.evaluate(()=>{const f=document.querySelector('.composer'); f.requestSubmit&&f.requestSubmit();});
await page.waitForTimeout(8000);
console.log('tras intentar preguntar:', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.dock .msg')].slice(-3).map(m=>m.className+' :: '+m.textContent.trim().slice(0,90))),null,1));
await page.screenshot({path:SHOT+'deadend-cp1.png'});
await browser.close();
