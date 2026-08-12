import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
const sid = await page.evaluate(() => window.__tutoriaSesion.session_id ?? window.__tutoriaSesion.id);
console.log('SESSION_ID:', sid); fs.writeFileSync(SP+'/sid3.txt', String(sid));
await page.click('#ask'); await page.waitForTimeout(500);
await page.evaluate(async (sid) => { for (let i=1;i<=12;i++){
  await fetch(`/api/session/${sid}/chat`,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({pregunta:`Calentamiento ${i}: por que baja la recta?`})}); } }, sid);

async function tecladoEnviar(txt, label){
  await page.click('.composer-input').catch(()=>{});   // puede fallar si pointer-events:none
  await page.evaluate(()=>document.querySelector('.composer-input').focus());
  await page.keyboard.type(txt, {delay: 8});
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  const s = await page.evaluate(()=>{
    const msgs=[...document.querySelectorAll('.dock .mensaje, .dock p, .dock li')].map(n=>n.textContent.trim()).filter(Boolean);
    const cs=getComputedStyle(document.querySelector('.composer-input'));
    return {ultimo: msgs.slice(-1)[0]||null, restantes: document.querySelector('.composer-restantes')?.textContent,
            pe: cs.pointerEvents, op: cs.opacity, valor: document.querySelector('.composer-input').value};
  });
  console.log(`${label}: ultimo=${JSON.stringify(s.ultimo)}`);
  console.log(`${label}: restantes=${s.restantes} pointerEvents=${s.pe} opacity=${s.op} textareaTrasEnviar=${JSON.stringify(s.valor)}`);
}
console.log('\n== 13a pregunta, solo teclado =='); await tecladoEnviar('MARCADOR_PERDIDO_UNO no entiendo la pendiente','13');
console.log('\n== 14a pregunta, solo teclado (composer ya gris) =='); await tecladoEnviar('MARCADOR_PERDIDO_DOS sigo sin entender','14');
console.log('\n== 15a pregunta, solo teclado =='); await tecladoEnviar('MARCADOR_PERDIDO_TRES por favor ayuda','15');
await page.screenshot({path:SP+'/limite-teclado.png'});
await browser.close();
