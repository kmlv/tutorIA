import {abrir, qInfo} from './manip-lib.mjs';
const SS='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/';
const {browser, page} = await abrir({lang:'es'});
await page.evaluate('window.__tutoria.practice.start(); 1');
const sel = '.dock .pregunta:last-child ';
let s=null;
for (let i=0;i<16;i++){
  await page.waitForTimeout(500);
  s = await qInfo(page); if (!s) continue;
  if (s.cls.includes('q-manip')) break;
  if (s.cls.includes('q-mcq')) await page.click(sel+'.q-opciones button');
  else if (s.cls.includes('q-numeric')) { await page.fill(sel+'.q-input','1'); await page.click(sel+'button[type=submit]'); }
  else if (s.cls.includes('q-open')) { await page.fill(sel+'.q-textarea','no se'); await page.click(sel+'button[type=submit]'); }
}
console.log('MANIP:', s.enun);

// coordenadas de PANTALLA del tirador de x, via getScreenCTM (lo que ve el raton)
async function pantallaTirador(idx){ // 1 = hit de x, 3 = hit de y  (orden: ring,hit,ring,hit)
  return await page.evaluate((i) => {
    const cs=[...document.querySelectorAll('.capa-manip circle')];
    const c=cs[i]; const svg=c.ownerSVGElement; const m=svg.getScreenCTM();
    const p=new DOMPoint(+c.getAttribute('cx'), +c.getAttribute('cy')).matrixTransform(m);
    return {cx:+c.getAttribute('cx'), cy:+c.getAttribute('cy'), sx:p.x, sy:p.y};
  }, idx);
}
const t0 = await pantallaTirador(1);
console.log('tirador x ANTES (svg y pantalla):', JSON.stringify(t0));
await page.screenshot({path:SS+'tope-A-antes.png'});

// ARRASTRE: agarrar el tirador de x y llevarlo al borde derecho de la ventana
await page.mouse.move(t0.sx, t0.sy);
await page.mouse.down();
for (const x of [700, 900, 1100, 1279]) { await page.mouse.move(x, t0.sy, {steps:5}); await page.waitForTimeout(60); }
await page.mouse.up();
await page.waitForTimeout(300);

const t1 = await pantallaTirador(1);
console.log('tirador x DESPUES:', JSON.stringify(t1));
const info = await page.evaluate(() => {
  const cs=[...document.querySelectorAll('.capa-manip circle')];
  const c=cs[1]; const svg=c.ownerSVGElement; const m=svg.getScreenCTM();
  const p=new DOMPoint(+c.getAttribute('cx'), +c.getAttribute('cy')).matrixTransform(m);
  const el = document.elementFromPoint(Math.min(p.x, innerWidth-1), Math.min(p.y, innerHeight-1));
  const svgR = svg.getBoundingClientRect();
  const linea = document.querySelector('.capa-linea .recta.linea');
  return {
    viewBox: svg.getAttribute('viewBox'),
    svgRect: svgR.toJSON(),
    svgOverflow: getComputedStyle(svg).overflow,
    puntoPantalla: {x:p.x, y:p.y},
    dentroDeSVG: p.x >= svgR.left && p.x <= svgR.right && p.y>=svgR.top && p.y<=svgR.bottom,
    elementFromPoint: el ? el.tagName+'.'+(el.className.baseVal ?? el.className) : null,
    textoIntercepto: [...document.querySelectorAll('.capa-interceptos text')].map(t=>t.textContent),
    lineaX2: linea? linea.getAttribute('x2') : null,
    aria: svg.getAttribute('aria-label'),
    botones: [...document.querySelectorAll('.dock .pregunta:last-child button')].map(b=>b.textContent+(b.disabled?'[DIS]':'')),
  };
});
console.log('INFO:', JSON.stringify(info,null,1));
await page.screenshot({path:SS+'tope-B-fuera.png'});

// ¿Se puede recuperar con el raton? intento 1: clicar donde ESTABA
await page.mouse.move(t0.sx, t0.sy); await page.mouse.down();
await page.mouse.move(t0.sx-100, t0.sy, {steps:5}); await page.mouse.up();
await page.waitForTimeout(200);
console.log('tras click en la posicion ORIGINAL:', JSON.stringify(await pantallaTirador(1)));

// intento 2: doble click en el lienzo
await page.mouse.dblclick(t0.sx, t0.sy); await page.waitForTimeout(200);
console.log('tras dblclick:', JSON.stringify(await pantallaTirador(1)));

// intento 3: arrastrar desde el borde derecho del svg hacia dentro
const svgR = info.svgRect;
await page.mouse.move(svgR.right-2, t0.sy); await page.mouse.down();
await page.mouse.move(svgR.left+200, t0.sy,{steps:5}); await page.mouse.up();
await page.waitForTimeout(200);
console.log('tras arrastrar desde el borde derecho del svg:', JSON.stringify(await pantallaTirador(1)));

// intento 4: teclado (flecha izquierda) - ¿tiene foco algo?
const foco = await page.evaluate(()=>{const a=document.activeElement; return a? a.tagName+'.'+(a.className.baseVal??a.className)+' role='+a.getAttribute('role'):null;});
console.log('activeElement:', foco);
await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(150);
console.log('tras ArrowLeft:', JSON.stringify(await pantallaTirador(1)));
await page.screenshot({path:SS+'tope-C-recuperacion.png'});
await browser.close();
