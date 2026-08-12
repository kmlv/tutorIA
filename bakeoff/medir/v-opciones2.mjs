import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');

async function corrida(indice, etiqueta) {
  const browser = await chromium.launch({executablePath: exe,
    args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await browser.newContext({viewport:{width:1280,height:860}});
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
  await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
  await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
  await page.evaluate(() => { window.__tutoria.media.seek(143); window.__tutoria.media.play(); });
  await page.waitForSelector('.q', {timeout:20000});
  await page.waitForTimeout(1200);

  console.log('\n########## ' + etiqueta + ' (pulsa opcion #' + (indice+1) + ') ##########');

  // que dice el CSS
  const css = await page.evaluate(() => {
    const b = document.querySelector('.q-opcion');
    const root = getComputedStyle(document.documentElement);
    const reglas = [];
    for (const ss of document.styleSheets) {
      let rs; try { rs = ss.cssRules; } catch(e) { continue; }
      for (const r of rs) {
        if (r.selectorText && /q-opcion|elegida|button/.test(r.selectorText)
            && /border|background|outline|color|opacity|font-weight/.test(r.cssText)) {
          reglas.push(r.cssText.slice(0,160));
        }
      }
    }
    return {
      accent: root.getPropertyValue('--accent'),
      line: root.getPropertyValue('--line'),
      ok: root.getPropertyValue('--ok'),
      mal: root.getPropertyValue('--mal') || root.getPropertyValue('--error'),
      reglas
    };
  });
  console.log('--accent =', JSON.stringify(css.accent), ' --line =', JSON.stringify(css.line));
  console.log('reglas relevantes:'); css.reglas.forEach(r=>console.log('   ', r));

  const opts = await page.$$('.q-opciones button');
  const textos = []; for (const o of opts) textos.push((await o.textContent()).trim());
  await opts[indice].click();
  await page.waitForTimeout(3500);   // esperar respuesta del servidor + posible marcado diferido

  const r = await page.evaluate((textos) => {
    const bs = [...document.querySelectorAll('.q .q-opciones button')];
    const clave = b => { const cs = getComputedStyle(b);
      return [cs.backgroundColor,cs.borderColor,cs.color,cs.boxShadow,cs.opacity,cs.fontWeight].join('|'); };
    const ks = bs.map(clave);
    const dock = document.querySelector('.dock');
    return {
      clases: bs.map(b=>b.className),
      borderColors: bs.map(b=>getComputedStyle(b).borderColor),
      identicas: ks.every(k=>k===ks[0]),
      claves: ks,
      dockTexto: dock ? dock.innerText.replace(/\n{2,}/g,'\n').slice(-900) : null,
      dockEstado: window.__tutoria.dock ? JSON.stringify(window.__tutoria.dock.actual).slice(0,600) : null,
    };
  }, textos);
  console.log('clases:', JSON.stringify(r.clases));
  console.log('border-color por boton:', JSON.stringify(r.borderColors));
  console.log('LAS 4 SE VEN IDENTICAS:', r.identicas);
  console.log('--- texto del dock (cola) ---\n' + r.dockTexto);
  console.log('--- dock.actual ---\n' + r.dockEstado);

  await page.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v2-${etiqueta}.png`});
  const q = await page.$('.q');
  if (q) await q.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v2-${etiqueta}-q.png`});
  const dk = await page.$('.dock');
  if (dk) await dk.screenshot({path:`/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/v2-${etiqueta}-dock.png`});
  await browser.close();
}

await corrida(2, 'incorrecta');   // "Pivota sobre el intercepto de x2"
await corrida(0, 'correcta');     // "Se desplaza hacia afuera, paralela"
