import {abrir} from './_lib.mjs';
const {browser, page} = await abrir();
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const q = document.querySelector('.q');
  const doc = document.documentElement;
  return {
    scrollY: window.scrollY,
    docH: doc.scrollHeight,
    innerH: window.innerHeight,
    enun: document.querySelector('.q-enunciado')?.textContent,
    opts: [...document.querySelectorAll('.q-opciones button')].map(b=>b.textContent.trim()),
    manip: !!document.querySelector('.q-manip'),
    qHTML: q ? q.outerHTML.slice(0,1200) : null,
  };
});
console.log(JSON.stringify(info,null,1));
await browser.close();
