import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const chatPosts=[];
page.on('request', r => { if (r.method()==='POST' && /\/chat$/.test(new URL(r.url()).pathname)) chatPosts.push(JSON.parse(r.postData()||'{}').pregunta); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.locator('#ask').first().click(); await page.waitForTimeout(500);
const inp = page.locator('.composer-input');
async function E(){ return await page.evaluate(`(()=>{const c=document.querySelector('.composer'),i=document.querySelector('.composer-input'),b=document.querySelector('.composer-enviar'),r=document.querySelector('.composer-restantes'),cs=getComputedStyle(i);
 return {agotado:c.getAttribute('data-agotado'),restantes:r.textContent.trim(),inputDisabled:i.disabled,btnDisabled:b.disabled,ph:i.placeholder,pe:cs.pointerEvents,op:cs.opacity,foco:document.activeElement===i,n:document.querySelectorAll('.dock-body > *').length};})()`);}
async function esperarTutor(n){ await page.waitForFunction(`(()=>{const a=[...document.querySelectorAll('.dock-body > *')];return a.length>=${n}&&a[a.length-1].className.includes('tutor');})()`,null,{timeout:40000}); await page.waitForTimeout(250);}

const qs=['por que sube la linea','que significa la pendiente','y si baja el precio','que es el ingreso','como se calcula','de donde sale el 4','que pasa si gasto menos','explicame otra vez','no entiendo el eje','que unidades son','y el cafe','ultima duda'];
for(let i=0;i<12;i++){ await inp.click({force:true}); await inp.fill(qs[i]); await page.keyboard.press('Enter'); await esperarTutor((i+1)*2); }
console.log('=== TRAS LAS 12 PREGUNTAS PERMITIDAS ==='); console.log(JSON.stringify(await E()));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/C-tras12.png'});

console.log('\n=== A PARTIR DE AQUI: SOLO TECLADO. NUNCA SE TOCA EL RATON. ===');
for(const [k,txt] of [[13,'Entonces me quedo sin ayuda? necesito entender esto para el examen'],[14,'hola?'],[15,'porfa ayudame'],[16,'sigo aqui'],[17,'me respondes?'],[18,'ultimo intento']]){
  const antes=chatPosts.length; const pre=await E();
  await page.keyboard.type(txt);
  const v=await page.evaluate(`document.querySelector('.composer-input').value`);
  await page.keyboard.press('Enter'); await page.waitForTimeout(3800);
  const e=await E();
  const ult=await page.evaluate(`(()=>{const a=[...document.querySelectorAll('.dock-body > *')];return a.slice(-2).map(x=>x.className+' :: '+x.textContent.trim().slice(0,95));})()`);
  console.log(`\nINTENTO ${k}  (foco previo en la caja: ${pre.foco}, aspecto previo: agotado="${pre.agotado}" opacity=${pre.op} pointer-events=${pre.pe})`);
  console.log(`  texto que ACEPTO la caja: ${JSON.stringify(v)}`);
  console.log(`  POST /chat disparados: ${chatPosts.length-antes}   burbujas: ${pre.n} -> ${e.n}   restantes:"${e.restantes}"`);
  console.log(`  aspecto ahora: agotado="${e.agotado}" opacity=${e.op} pointer-events=${e.pe} inputDisabled=${e.inputDisabled} btnDisabled=${e.btnDisabled} placeholder="${e.ph}" focoEnLaCaja=${e.foco}`);
  ult.forEach(u=>console.log('   ',u));
}
console.log('\n=== ¿El raton SI esta bloqueado ahora? ===');
try{ await page.locator('.composer-enviar').click({timeout:2500}); console.log('  raton: NO bloqueado'); }catch(err){ console.log('  raton: BLOQUEADO (pointer-events:none) ->', String(err.message).split('\n').find(l=>/intercept|not stable|pointer/i.test(l))||'timeout'); }
console.log('\nTOTAL POST /chat en la sesion:', chatPosts.length, '-> permitidos por el servidor: 12');
console.log('preguntas enviadas al servidor pasado el limite:', JSON.stringify(chatPosts.slice(12)));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/D-final.png'});
await browser.close();
