import {abrir, hastaManip, qInfo, msgs} from './manip-lib.mjs';
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page, red} = await abrir();
console.log('MANIP:', JSON.stringify(await hastaManip(page)));

// mapa svg -> pantalla
const map = await page.evaluate(()=>{
  const svg=document.querySelector('svg.bgraph'); const m=svg.getScreenCTM();
  return {a:m.a,d:m.d,e:m.e,f:m.f};
});
const S = (x,y)=>[map.a*x+map.e, map.d*y+map.f];
console.log('map', map);
const tirs = async ()=> await page.evaluate(()=>[...document.querySelectorAll('.capa-manip .tirador')].map(t=>({cx:+t.getAttribute('cx'), cy:+t.getAttribute('cy')})));
console.log('tiradores iniciales', await tirs());

async function drag(from, to, pasos=12){
  await page.mouse.move(from[0], from[1]);
  await page.mouse.down();
  for (let i=1;i<=pasos;i++){
    await page.mouse.move(from[0]+(to[0]-from[0])*i/pasos, from[1]+(to[1]-from[1])*i/pasos);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(60);
}
// tirador X esta en (355.75, 396) en coords svg ; tirador Y en (62, 169.75)
const t0 = await tirs();
const hX = t0.find(t=>t.cy>300), hY = t0.find(t=>t.cy<300);
console.log('hX', hX, 'hY', hY);

// === TEST: arrastrar el tirador X MUY fuera del grafico (a la derecha)
await drag(S(hX.cx,hX.cy), [1279, S(0,396)[1]]);
console.log('tras arrastrar X fuera:', await tirs());
console.log('estado reportado', await page.evaluate(()=>{
  const svg=document.querySelector('svg.bgraph');
  const l=svg.querySelector('.capa-linea .recta.linea');
  const txt=[...svg.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent);
  return {linea:{x1:l.getAttribute('x1'),y1:l.getAttribute('y1'),x2:l.getAttribute('x2'),y2:l.getAttribute('y2')}, textos:txt, aria:svg.getAttribute('aria-label')};
}));
await page.screenshot({path:SP+'manip-fuera-derecha.png'});
// se puede volver a agarrar?
const t1 = await tirs();
const hX2 = t1.find(t=>t.cy>300);
const pos = S(hX2.cx, hX2.cy);
console.log('tirador X ahora en pantalla', pos, 'viewport 1280x860');
const alcanzable = await page.evaluate(([x,y])=>{
  const el = document.elementFromPoint(x,y);
  return el ? el.tagName+'.'+(el.getAttribute&&el.getAttribute('class')) : 'FUERA DE PANTALLA/null';
}, pos);
console.log('elementFromPoint sobre el tirador X:', alcanzable);
await browser.close();
