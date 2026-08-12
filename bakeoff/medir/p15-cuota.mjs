import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const {browser, page} = await open('http://localhost:57330/?lang=es');
await page.evaluate(()=>{window.__tutoria.media.seek(60);});
await page.click('#ask'); await page.waitForTimeout(600);
const contador = () => page.evaluate(()=>[...document.querySelectorAll('.dock *')].map(e=>e.textContent.trim()).filter(t=>/^\d+ pregunta/.test(t)).pop()||'(sin contador)');
for (let i=1;i<=14;i++){
  const inputDisabled = await page.evaluate(()=>{const i=document.querySelector('.composer-input'); const b=document.querySelector('.composer-enviar'); return {inp:!!i&&i.disabled, btn:!!b&&b.disabled, ph:i?i.placeholder:null};});
  if (inputDisabled.inp || inputDisabled.btn) { console.log(`pregunta ${i}: BLOQUEADO`, JSON.stringify(inputDisabled)); break; }
  await page.fill('.composer-input','pregunta '+i);
  await page.click('.composer-enviar');
  await page.waitForTimeout(6500);
  const last = await page.evaluate(()=>{const m=[...document.querySelectorAll('.dock .msg')].pop(); return m?m.className+' :: '+m.textContent.trim().slice(0,60):'-';});
  console.log(`pregunta ${i}: contador=${await contador()} | ultimo=${last}`);
}
console.log('\n=== estado del composer al final ===');
console.log(JSON.stringify(await page.evaluate(()=>{const i=document.querySelector('.composer-input'); const b=document.querySelector('.composer-enviar');
  return {inpDisabled:i.disabled, ph:i.placeholder, btnDisabled:b.disabled, btnTxt:b.textContent.trim(),
    dock:document.querySelector('.dock').innerText.replace(/\n+/g,' | ').slice(-350)};}),null,1));
await page.screenshot({path:SHOT+'cuota-agotada.png'});
// ahora ir al checkpoint 1 y fallar
await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
await page.waitForFunction(()=>document.querySelectorAll('.q-opciones button').length>0, null, {timeout:25000});
await page.waitForTimeout(500);
await page.click('.q-opciones button:nth-child(2)');
await page.waitForTimeout(2500);
console.log('\n=== en cp1 tras fallar con la cuota agotada ===');
console.log(JSON.stringify(await page.evaluate(()=>({
  opciones:[...document.querySelectorAll('.q-opciones button')].map(b=>b.disabled),
  chips:[...document.querySelectorAll('.dock button')].map(b=>b.textContent.trim()+(b.disabled?'[DIS]':'')),
  composer:(()=>{const i=document.querySelector('.composer-input'); const b=document.querySelector('.composer-enviar'); return {inpDisabled:i.disabled, ph:i.placeholder, btnDisabled:b.disabled};})(),
  dock:document.querySelector('.dock').innerText.replace(/\n+/g,' | ').slice(-400),
})),null,1));
await page.screenshot({path:SHOT+'cuota-agotada-cp1.png'});
await browser.close();
