/**
 * Ataca las afirmaciones del prototipo de láminas en el navegador de verdad.
 *
 *   node bakeoff/medir/laminas-ataque.mjs http://localhost:5173
 *
 * No comprueba que "funcione": intenta escribir los fallos que la arquitectura dice que
 * son imposibles. Si alguno se deja escribir, la afirmación era falsa y sale aquí.
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { chromium } from 'playwright-core';

const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter((x) => x.startsWith('chromium-'))
  .sort((a, b) => +a.split('-')[1] - +b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const U = process.argv[2] || 'http://localhost:5173';

const browser = await chromium.launch({ executablePath: exe,
  args: ['--autoplay-policy=no-user-gesture-required'] });
const fallos = [];
const ok = (c, m) => { console.log(`  ${c ? '✓' : '✗'} ${m}`); if (!c) fallos.push(m); };

/** Huella de TODO lo visible que depende del estado: el gráfico, las tarjetas, la
 *  ecuación y los precios. Si el estado es total, dos caminos a la misma lámina dan la
 *  misma huella carácter por carácter. */
const HUELLA = `(() => {
  const n = (s) => (document.querySelector(s)?.outerHTML || '').replace(/\\s+/g, ' ');
  return n('.bands') + '||' + n('svg.bgraph') + '||' +
         (document.querySelector('.escenario')?.dataset.foco || '-');
})()`;

const abrir = async () => {
  const p = await (await browser.newContext()).newPage();
  p.on('pageerror', (e) => fallos.push(`error de página: ${e.message}`));
  await p.goto(`${U}/laminas.html`, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.paso', { timeout: 15000 });
  await p.waitForTimeout(700);
  return p;
};
const irA = async (p, i) => {
  await p.click(`.paso:nth-child(${i + 1})`);
  await p.waitForTimeout(320);
};

console.log('\nA4 — el estado es total: el camino no puede dejar rastro');
{
  const p = await abrir();
  const n = await p.evaluate('document.querySelectorAll(".paso").length');
  // Camino 1: en orden, 0 → 11.
  const enOrden = [];
  for (let i = 0; i < n; i++) { await irA(p, i); enOrden.push(await p.evaluate(HUELLA)); }

  // Camino 2: desde el final, hacia atrás. Es el que producía los dos precios del café:
  // el pivote ya había cambiado el precio a 4 y volver atrás no lo devolvía a 3.
  const alReves = new Array(n);
  for (let i = n - 1; i >= 0; i--) { await irA(p, i); alReves[i] = await p.evaluate(HUELLA); }

  const distintas = enOrden.map((h, i) => (h === alReves[i] ? null : i)).filter((x) => x !== null);
  ok(distintas.length === 0,
     `las ${n} láminas se pintan igual llegando en orden que llegando al revés`
     + (distintas.length ? ` — DIFIEREN en ${distintas.join(', ')}` : ''));

  // El ataque concreto de F-001, el que Kristian vio: la lámina del pivote sube el café a
  // 4. Salir de ella hacia atrás tiene que devolverlo a 3 sin que nadie lo deshaga.
  const iPivote = await p.evaluate(
    `fetch('/media/budget-line/laminas.es.json').then(r=>r.json()).then(b=>b.laminas.findIndex(l=>l.ledger.some(o=>o.precio)&&l.desde_op<l.ledger.length&&l.ledger.slice(l.desde_op).some(o=>o.precio)))`);
  const precios = async () => p.evaluate(
    `[...document.querySelectorAll('.price')].map(e=>e.textContent).join(' ')`);
  await irA(p, iPivote);
  const enPivote = await precios();
  await irA(p, 3);
  const atras = await precios();
  await irA(p, n - 1);
  const alFinal = await precios();
  ok(enPivote.includes('$4') && !atras.includes('$4'),
     `el precio del café vuelve solo: en el pivote "${enPivote.trim()}" → tras saltar atrás "${atras.trim()}"`);
  ok(!alFinal.includes('$4'),
     `y el recap lo deja como lo dice su propio ledger: "${alFinal.trim()}"`);
  await p.context().close();
}

console.log('\nA1 — un solo MP3 y ventanas contiguas: avanzar no busca');
{
  const p = await abrir();
  // Se instrumenta el elemento de audio para contar CADA salto del cabezal.
  await p.evaluate(`(() => {
    window.__saltos = [];
    const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      get: d.get,
      set(v) { const a = d.get.call(this); if (Math.abs(v - a) > 0.05) window.__saltos.push([+a.toFixed(3), +v.toFixed(3)]); d.set.call(this, v); },
    });
  })()`);
  // Se reproduce la lección ENTERA, a 16×, contestando lo que salga. No se salta con los
  // pasos: saltar sí busca, y debe. Lo que se afirma es que ESCUCHARLA seguida no lo hace.
  const n = await p.evaluate('document.querySelectorAll(".paso").length');
  await p.evaluate(`document.querySelector('audio') && (document.querySelectorAll('audio').forEach(a=>a.playbackRate=16))`);
  await p.click('.mandos button:has-text("Reproducir")').catch(() => {});
  const t0 = Date.now();
  let visto = 0;
  while (Date.now() - t0 < 90000) {
    await p.evaluate(`document.querySelectorAll('audio').forEach(a=>a.playbackRate=16)`);
    const pos = await p.evaluate(`+document.querySelector('.pos').textContent.match(/\\d+/)[0]`);
    visto = Math.max(visto, pos);
    if (pos === n && !(await p.evaluate(`!!document.querySelector('.pregunta:not(:has(.veredicto))')`))) break;
    // Si hay una pregunta esperando, se contesta: la lección espera al alumno a propósito.
    const hayQ = await p.evaluate(`!!document.querySelector('.pregunta:not(:has(.veredicto))')`);
    if (hayQ) {
      await p.evaluate(`(() => { const q = document.querySelector('.pregunta');
        const inp = q.querySelector('input[type=text], input[type=number], textarea');
        if (inp) { inp.value = '1'; inp.dispatchEvent(new Event('input', {bubbles:true})); }
        const b = [...q.querySelectorAll('button')].pop(); b && b.click(); })()`);
      await p.waitForTimeout(700);
      // Tras contestar NO se pulsa "Seguir" salvo en los checkpoints. En una predicción
      // la voz explica justo después, y saltársela es un salto de verdad — provocado por
      // el alumno, no por la arquitectura. Confundir los dos haría fallar la prueba por
      // lo que la prueba misma hizo.
      const esperaMano = await p.evaluate(
        `!![...document.querySelectorAll('audio')].every(a=>a.paused)`);
      if (esperaMano) await p.click('.mandos button.primario').catch(() => {});
    }
    await p.waitForTimeout(350);
  }
  const saltos = await p.evaluate('window.__saltos');
  ok(visto === n, `la lección llega sola hasta el final (lámina ${visto} de ${n})`);
  ok(saltos.length === 0,
     `escuchar las ${n} láminas seguidas no mueve el cabezal ni una vez`
     + (saltos.length ? ` — ${saltos.length} saltos: ${JSON.stringify(saltos.slice(0, 4))}` : ''));
  const src = await p.evaluate(`document.querySelectorAll('audio').length + '/' + (performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.mp3')).length)`);
  ok(!src.startsWith('0'), `hay un elemento de audio y un solo MP3 pedido (${src})`);
  await p.context().close();
}

console.log('\nA6 — el chat es ortogonal: ninguno de los dos mueve al otro');
{
  const p = await abrir();
  await irA(p, 5);
  const antes = await p.evaluate(HUELLA);
  await p.fill('.chat-input', 'una pregunta cualquiera');
  await p.click('.chat-form button');
  await p.waitForTimeout(400);
  const despues = await p.evaluate(HUELLA);
  const pos = await p.evaluate(`document.querySelector('.pos').textContent`);
  ok(antes === despues, 'escribir en el chat no cambia la lámina');
  ok(pos.includes('6'), `la lección no avanzó al usar el chat (${pos})`);

  // Y al revés: cambiar de lámina no puede borrar la conversación.
  const nAntes = await p.evaluate(`document.querySelectorAll('.chat-hist .msg').length`);
  await irA(p, 9);
  const nDespues = await p.evaluate(`document.querySelectorAll('.chat-hist .msg').length`);
  ok(nAntes > 0 && nDespues >= nAntes, `cambiar de lámina no borra el chat (${nAntes} → ${nDespues})`);

  const visible = await p.evaluate(`(() => { const r = document.querySelector('.chat-lateral').getBoundingClientRect(); return r.width > 100 && r.height > 100; })()`);
  ok(visible, 'el panel del tutor sigue en pantalla en todo momento');
  await p.context().close();
}

console.log('\nA7 — nunca hay dos láminas a la vez');
{
  const p = await abrir();
  const n = await p.evaluate('document.querySelectorAll(".paso").length');
  let peor = 0;
  for (let i = 0; i < n; i++) {
    await irA(p, i);
    peor = Math.max(peor, await p.evaluate(`document.querySelectorAll('.cuerpo > *').length`));
  }
  ok(peor === 1, `el cuerpo de la lámina nunca tiene más de un hijo (máximo visto: ${peor})`);
  await p.context().close();
}

console.log('\nA8 — la baraja no lleva la clave de respuestas');
{
  const p = await abrir();
  const crudo = await p.evaluate(`fetch('/media/budget-line/laminas.es.json').then(r=>r.text())`);
  const sospechosos = ['correcta', 'respuesta', 'key_points', 'verificacion', 'tolerancia'];
  const hallados = sospechosos.filter((s) => crudo.includes(s));
  ok(hallados.length === 0,
     `la baraja que descarga el navegador no contiene la clave${hallados.length ? ' — LLEVA: ' + hallados.join(', ') : ''}`);
  await p.context().close();
}

console.log('\nA9 — la voz no se adelanta a la pregunta');
{
  // La ventana de una predicción CONTIENE la respuesta hablada. Si la lámina reprodujera
  // antes de preguntar, regalaría el ítem.
  const p = await abrir();
  const laminas = await p.evaluate(`fetch('/media/budget-line/laminas.es.json').then(r=>r.json()).then(b=>b.laminas.map(l=>[l.id,l.tipo,l.momento||'-']))`);
  const preds = laminas.filter((l) => l[2] === 'despues');
  for (const [id] of preds) {
    const i = laminas.findIndex((l) => l[0] === id);
    await irA(p, i);
    const sonando = await p.evaluate(`[...document.querySelectorAll('audio')].some(a=>!a.paused)`);
    const hayPregunta = await p.evaluate(`!!document.querySelector('.pregunta')`);
    ok(!sonando && hayPregunta, `${id}: se pregunta primero y la voz calla`);
  }
  const cps = laminas.filter((l) => l[2] === 'antes');
  ok(cps.length === 2 && preds.length === 3,
     `${preds.length} predicciones preguntan antes de oír, ${cps.length} checkpoints oyen antes de preguntar`);
  await p.context().close();
}

await browser.close();
console.log(fallos.length ? `\n${fallos.length} AFIRMACIÓN(ES) FALSA(S)\n` : '\nlas afirmaciones aguantan\n');
process.exit(fallos.length ? 1 : 0);
