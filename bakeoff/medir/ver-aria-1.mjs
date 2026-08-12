import {abrir, hastaManip, qInfo, msgs} from './manip-lib.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page, red} = await abrir();
const m = await hastaManip(page);
console.log('MANIP enunciado:', m && m.enun);
console.log('MANIP nota:', m && m.nota);
console.log('MANIP btns:', m && JSON.stringify(m.btns));

const lee = async ()=> await page.evaluate(()=>{
  const svg=document.querySelector('svg.bgraph');
  const bands=document.querySelector('.bands');
  return {
    aria: svg ? svg.getAttribute('aria-label') : null,
    ariaRole: svg ? svg.getAttribute('role') : null,
    bandsText: bands ? bands.innerText.replace(/\n+/g,' | ') : null,
    fichas: [...document.querySelectorAll('.bands .ficha, .bands .chip, .bands [class*=ficha], .bands [class*=chip]')].map(e=>e.className+' >> '+e.innerText.replace(/\n/g,' ')),
    estado: window.__tutoria.estado ? window.__tutoria.estado() : null,
    t: window.__tutoria.media.currentTime(),
  };
});
console.log('ANTES DE ARRASTRAR:', JSON.stringify(await lee(), null, 1));

const map = await page.evaluate(()=>{const m=document.querySelector('svg.bgraph').getScreenCTM();return {a:m.a,d:m.d,e:m.e,f:m.f};});
const S=(x,y)=>[map.a*x+map.e, map.d*y+map.f];
async function drag(from,to,pasos=14){
  await page.mouse.move(from[0],from[1]); await page.mouse.down();
  for(let i=1;i<=pasos;i++){await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos); await page.waitForTimeout(16);}
  await page.mouse.up(); await page.waitForTimeout(80);
}
await drag(S(355.75,396), S(502.6,396));
await drag(S(62,169.75), S(62,56.6));
await page.waitForTimeout(200);
console.log('TRAS RESOLVER BIEN:', JSON.stringify(await lee(), null, 1));
await page.screenshot({path:SP+'aria-antes-enviar.png'});
red.length=0;
await page.click('.dock .pregunta:last-child button');
await page.waitForTimeout(2000);
console.log('RED:', JSON.stringify(red, null, 1));
console.log('MSGS:', JSON.stringify((await msgs(page)).slice(-4), null, 1));
console.log('DESPUES DE ENVIAR:', JSON.stringify(await lee(), null, 1));
await page.screenshot({path:SP+'aria-despues-enviar.png'});
await browser.close();
