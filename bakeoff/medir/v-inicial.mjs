import {abrir} from './lib.mjs';
const {browser, page} = await abrir('http://localhost:57330/?lang=es&t=0');
const info = await page.evaluate(() => {
  const lienzo = document.querySelector('.lienzo');
  const esc = document.querySelector('.escenario');
  const btns = [...document.querySelectorAll('button')].map(b=>({txt:b.innerText.trim().slice(0,40), id:b.id, cls:b.className.slice(0,60), vis:b.offsetParent!==null}));
  return {
    lienzoExiste: !!lienzo,
    lienzoRect: lienzo ? lienzo.getBoundingClientRect() : null,
    lienzoHTMLlen: lienzo ? lienzo.innerHTML.length : null,
    lienzoHTMLhead: lienzo ? lienzo.innerHTML.slice(0,1200) : null,
    lienzoHijos: lienzo ? lienzo.children.length : null,
    escRect: esc ? esc.getBoundingClientRect() : null,
    escTxt: esc ? esc.innerText.replace(/\n+/g,' | ').slice(0,300) : null,
    botones: btns,
    dur: window.__tutoria.media.duration(),
    t: window.__tutoria.media.currentTime()
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({path:'v-00-listo.png'});
await browser.close();
