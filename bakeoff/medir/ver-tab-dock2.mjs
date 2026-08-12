import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const net = [];
page.on('response', async r => { if (r.request().method()==='POST') net.push(r.status()+' '+r.url()); });
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});

const snap = async (tag) => {
  const s = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    const cs = dock ? getComputedStyle(dock) : null;
    const r = dock ? dock.getBoundingClientRect() : null;
    const inp = document.querySelector('.composer-input');
    const ri = inp ? inp.getBoundingClientRect() : null;
    const cnt = [...document.querySelectorAll('.dock *')].map(e=>e.textContent.trim())
        .filter(t=>/pregunta/i.test(t) && t.length<40);
    return {
      dockActual: window.__tutoria?.dock?.actual,
      dockClass: dock?.className,
      dockRect: r && {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},
      display: cs?.display, visibility: cs?.visibility, opacity: cs?.opacity,
      transform: cs?.transform, pointerEvents: cs?.pointerEvents,
      ariaHidden: dock?.getAttribute('aria-hidden'), inert: dock?.hasAttribute('inert'),
      hidden: dock?.hasAttribute('hidden'),
      inputRect: ri && {x:Math.round(ri.x),y:Math.round(ri.y),w:Math.round(ri.width),h:Math.round(ri.height)},
      inputValue: inp?.value,
      scrollX: window.scrollX, docW: document.documentElement.scrollWidth,
      contadorTxt: cnt.slice(0,4),
      dockText: dock ? dock.innerText.replace(/\s+/g,' ').slice(0,400) : null,
      // is the dock's center point actually the dock? (hit test)
      hitAtInput: ri ? (()=>{const el=document.elementFromPoint(Math.min(ri.x+2,1279), ri.y+5); return el?el.tagName+'.'+el.className:'null';})() : null,
    };
  });
  console.log('--- '+tag);
  console.log(JSON.stringify(s,null,1));
  return s;
};

await snap('carga limpia');
for (let i=0;i<6;i++) await page.keyboard.press('Tab');
console.log('foco tras 6 Tab:', await page.evaluate(()=>document.activeElement.className));
await snap('tras 6 Tab (foco en composer-input)');
await page.screenshot({path:'tabdock-antes.png'});

await page.keyboard.type('hola tutor');
await snap('tras escribir');
await page.keyboard.press('Enter');
await page.waitForTimeout(6000);
const after = await snap('tras Enter + 6s');
await page.screenshot({path:'tabdock-despues.png'});
console.log('POSTs:', net);

// what does a mouse-only user see? click Preguntar and compare
await browser.close();
