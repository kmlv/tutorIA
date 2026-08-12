import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
await page.click('#play');
await page.waitForTimeout(600);
await page.evaluate(() => { window.__tutoria.media.seek(192.5); window.__tutoria.media.play(); });
await page.waitForFunction('window.__tutoria.media.paused()', null, {timeout:30000});
await page.waitForTimeout(1200);

const arbol = async (tag) => {
  const r = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    const out = [];
    const walk = (el, depth) => {
      if (depth > 4) return;
      const b = el.getBoundingClientRect();
      const propio = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').slice(0,80);
      out.push({depth, tag: el.tagName.toLowerCase(), cls: el.className||'',
                y: Math.round(b.top)+'..'+Math.round(b.bottom), propio});
      for (const c of el.children) walk(c, depth+1);
    };
    walk(dock, 0);
    return out;
  });
  console.log('\n########## ' + tag + ' ##########');
  for (const n of r) console.log('  '.repeat(n.depth) + `<${n.tag} class="${n.cls}"> y=${n.y}` + (n.propio? `  TEXTO:"${n.propio}"`:''));
};
await arbol('ANTES de contestar la vieja');
await page.evaluate(() => document.querySelectorAll('.q')[0].querySelectorAll('.q-opciones button')[0].click());
await page.waitForTimeout(1500);
await arbol('DESPUES de contestar la vieja');
await page.screenshot({path:'/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-dosq-arbol.png', fullPage:false});
// donde queda 'Correcto.' respecto de los enunciados
const geo = await page.evaluate(() => {
  const find = (txt) => [...document.querySelectorAll('.dock *')].filter(e=>e.children.length===0 && e.textContent.trim().startsWith(txt))
     .map(e=>{const b=e.getBoundingClientRect(); return {cls:e.className, txt:e.textContent.trim().slice(0,70), top:Math.round(b.top)};});
  return {correcto: find('Correcto'), ing: find('Tu ingreso'), jugo: find('¿Por qué el intercepto')};
});
console.log('\nGEOMETRIA: ' + JSON.stringify(geo, null, 1));
await browser.close();
