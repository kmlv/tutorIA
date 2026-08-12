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
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
await page.click('#play');                       // Seguir, sin contestar cp1
await page.waitForTimeout(600);
await page.evaluate(() => { window.__tutoria.media.seek(192.5); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
await page.waitForTimeout(1200);

const hilo = async (tag) => {
  const r = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    // encontrar el contenedor del hilo: padre comun de las .q
    const qs=[...dock.querySelectorAll('.q')];
    const cont = qs.length ? qs[0].parentElement : dock;
    return {
      contCls: cont.className,
      hijos: [...cont.children].map((el,i)=>{
        const r = el.getBoundingClientRect();
        return {i, tag: el.tagName.toLowerCase(), cls: el.className,
                txt: (el.innerText||'').replace(/\n+/g,' ⏎ ').trim().slice(0,110),
                top: Math.round(r.top), bot: Math.round(r.bottom), h: Math.round(r.height),
                visible: r.height>0 && r.bottom>0 && r.top<window.innerHeight};
      })
    };
  });
  console.log('\n===== ' + tag + ' =====  contenedor .' + r.contCls);
  for (const h of r.hijos) console.log(`  [${h.i}] <${h.tag} class="${h.cls}"> y=${h.top}..${h.bot} vis=${h.visible}\n        "${h.txt}"`);
};

await hilo('ANTES de contestar la vieja');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-A.png'});

await page.evaluate(() => document.querySelectorAll('.q')[0].querySelectorAll('.q-opciones button')[0].click());
await page.waitForTimeout(1500);
await hilo('DESPUES de contestar la vieja (opcion 1 = correcta de cp1)');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-B.png'});

// ¿Y si contesto MAL la vieja? ¿el grafico reacciona y pisa el estado de cp2?
const est1 = await page.evaluate(()=>JSON.stringify(window.__tutoria.estado()));
console.log('\nestado tras contestar la vieja: ' + est1);

// ¿sigue usable cp2? escribir y enviar
const hayInput = await page.evaluate(()=>!!document.querySelector('.composer-input'));
console.log('hay composer-input: ' + hayInput);
await page.fill('.composer-input', 'Porque el precio del jugo no cambia.');
await page.click('.composer-enviar');
await page.waitForTimeout(2500);
await hilo('DESPUES de responder cp2');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-C.png'});
await browser.close();
