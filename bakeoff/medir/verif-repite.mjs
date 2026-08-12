// Verificación independiente: ¿se repite una pregunta ya contestada justo después de una abierta?
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';

const OPEN_TEXT = process.argv[2] || 'correcta';
const OUT = process.argv[3] || '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/verif-repite.json';
const MAXIT = 45;
const STOP_AT = Number(process.argv[4] ?? -1);

const TEXTO_ABIERTA = OPEN_TEXT === 'bla'
  ? 'bla bla'
  : 'El intercepto vertical es m/p2 y no depende de p1, asi que subir el precio del cafe no lo mueve: la recta pivota sobre ese punto.';

// Claves derivadas de content/packs/budget-line/questions.yaml (opción marcada correcta / expr).
const CLAVE_MCQ = {
  q_int_mcq: 'm/p2',
  q_slope_mcq: '-p1/p2',
  q_feas_mcq: 'Sí, gasta 50 y te sobran 50',
  q_cp1_income_direction: 'Se desplaza hacia afuera, paralela',
  q_cs_p_mcq: 'Pivota: el intercepto del jugo no se mueve y la recta se empina',
  q_eq_mcq: 'p1·x1 + p2·x2 = m',
  q_eq_mcq_terms: 'Lo que gastas en el bien 1',
  q_predict_line_vs_set: 'Las canastas que gastan exactamente todo el ingreso',
  q_predict_slope_sign: '3 litros',
  q_predict_price_effect: 'Gira: el intercepto del jugo no se mueve',
};
const CLAVE_NUM = {
  q_int_numeric_1: 'm / p2',
  q_int_numeric_2: 'm / p1',
  q_slope_numeric: '-p1 / p2',
  q_eq_numeric: '(m - p1*12) / p2',
  q_cs_m_numeric: '150 / p2',
};

const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x => x.startsWith('chromium-'))
  .sort((a, b) => +a.split('-')[1] - +b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport: {width: 1280, height: 860}});
const page = await ctx.newPage();

const log = {openText: TEXTO_ABIERTA, jsErrors: [], consoleErrors: [], net: [], steps: []};
page.on('pageerror', e => { log.jsErrors.push(String(e).slice(0, 400)); console.log('  JS ERROR:', String(e).slice(0, 200)); });
page.on('console', m => { if (m.type() === 'error') log.consoleErrors.push(m.text().slice(0, 300)); });
page.on('response', async r => {
  const u = r.url();
  if (u.includes('/api/')) { let b = null; try { b = (await r.text()).slice(0, 2000); } catch {}
    log.net.push({url: u.replace('http://localhost:57330', ''), status: r.status(), body: b}); }
});
page.on('request', r => {
  const u = r.url();
  if (u.includes('/api/') && r.method() === 'POST') log.net.push({url: 'POST ' + u.replace('http://localhost:57330', ''), body: (r.postData() || '').slice(0, 400)});
});

await page.goto('http://localhost:57330/?lang=es', {waitUntil: 'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout: 30000});
await page.evaluate(() => { const m = window.__tutoria.media; m.seek(m.duration() - 1.2); m.play(); });

const dockText = () => page.evaluate(() => Array.from(document.querySelectorAll('.dock-body > *')).map(n => ({cls: n.className, txt: n.textContent.trim().slice(0, 300)})));
async function press(key, n) {
  await page.locator('.capa-manip rect[role=slider]').first().focus();
  for (let i = 0; i < n; i++) await page.keyboard.press(key);
  await page.waitForTimeout(120);
}

let lastCount = 0;
for (let i = 0; i < MAXIT; i++) {
  let ok = true;
  try { await page.waitForFunction((n) => document.querySelectorAll('.dock-body .pregunta').length > n, lastCount, {timeout: 20000}); }
  catch { ok = false; }
  if (!ok) { log.steps.push({i, event: 'SIN_NUEVA_PREGUNTA'}); console.log('#' + i + ' TIMEOUT'); break; }
  lastCount = await page.evaluate(() => document.querySelectorAll('.dock-body .pregunta').length);
  await page.waitForTimeout(300);

  const q = await page.evaluate(() => {
    const ps = document.querySelectorAll('.dock-body .pregunta');
    const last = ps[ps.length - 1];
    return {cls: last.querySelector('.q').className,
            enunciado: last.querySelector('.q-enunciado')?.textContent || '',
            opciones: Array.from(last.querySelectorAll('.q-opcion')).map(b => b.textContent)};
  });
  const lastNext = [...log.net].reverse().find(n => n.url.endsWith('/next') && n.status);
  let qid = null, socr = null, assist = null;
  try { const j = JSON.parse(lastNext.body); qid = j.question?.id; socr = j.socratica; assist = j.assist; } catch {}
  const modal = q.cls.includes('q-mcq') ? 'mcq' : q.cls.includes('q-numeric') ? 'numeric'
    : q.cls.includes('q-open') ? 'open' : q.cls.includes('q-manip') ? 'manip' : '?';
  const step = {i, qid, modalidad: modal, enunciado: q.enunciado, opciones: q.opciones, socratica: socr, assist};
  const ultima = page.locator('.dock-body .pregunta').last();

  if (STOP_AT >= 0 && i === STOP_AT) {
    // Geometría: ¿se ve el "Correcto." de la primera vez a la vez que la repetición?
    step.geo = await page.evaluate(() => {
      const body = document.querySelector('.dock-body');
      const vis = body.getBoundingClientRect();
      return Array.from(body.children).map((n, k) => {
        const r = n.getBoundingClientRect();
        return {k, cls: n.className, txt: n.textContent.trim().replace(/\s+/g, ' ').slice(0, 70),
                top: Math.round(r.top), bottom: Math.round(r.bottom),
                visible: r.bottom > vis.top && r.top < vis.bottom};
      });
    });
    await page.screenshot({path: OUT.replace('.json', '-repeticion.png')});
    log.steps.push(step);
    console.log('#' + i + ' PARADA en ' + qid);
    break;
  }

  if (modal === 'mcq') {
    // Respuesta correcta: elegida por TEXTO desde la clave derivada del pack.
    const correcto = CLAVE_MCQ[qid];
    let idx = q.opciones.findIndex(o => o.trim() === correcto);
    if (idx < 0) idx = 0;
    step.eligio = q.opciones[idx];
    await ultima.locator('.q-opcion').nth(idx).click();
  } else if (modal === 'numeric') {
    const expr = CLAVE_NUM[qid];
    const st = await page.evaluate(() => window.__tutoria.estado());
    const val = String(Number(new Function('m', 'p1', 'p2', 'return (' + expr + ')')(st.m, st.p1, st.p2)).toFixed(3));
    step.eligio = val;
    await ultima.locator('.q-input').fill(val);
    await ultima.locator('button[type=submit]').click();
  } else if (modal === 'open') {
    step.eligio = TEXTO_ABIERTA;
    await ultima.locator('.q-textarea').fill(TEXTO_ABIERTA);
    await ultima.locator('button[type=submit]').click();
  } else if (modal === 'manip') {
    const esPunto = await page.evaluate(() => !!document.querySelector('.punto-manip'));
    if (esPunto) { await press('ArrowLeft', 2); step.eligio = 'punto dentro'; }
    else if (/ingreso sube a 150/i.test(q.enunciado)) { await press('ArrowUp', 50); await press('ArrowRight', 17); step.eligio = 'recta m=150'; }
    else if (/precio del caf/i.test(q.enunciado)) { await press('ArrowLeft', 8); step.eligio = 'recta p1=4'; }
    else { await press('ArrowUp', 10); step.eligio = 'sin regla'; }
    await ultima.locator('button.primario').click();
  } else { step.eligio = 'DESCONOCIDO'; log.steps.push(step); break; }

  await page.waitForTimeout(2200);
  const after = await dockText();
  step.dockAfter = after.slice(-3);
  const ans = [...log.net].reverse().find(n => n.url.endsWith('/answer') && n.status);
  step.answerResp = ans?.body;
  log.steps.push(step);
  console.log(`#${i} ${qid} [${modal}] ${String(step.eligio).slice(0, 34)} => ${(step.answerResp || 'SIN POST').slice(0, 90)}`);
  if (after.some(x => /Eso es todo por ahora/.test(x.txt))) { console.log('>>> CIERRE'); break; }
}

log.sessionId = await page.evaluate(() => window.__tutoriaSesion?.session_id ?? null);
log.final = {dock: await dockText()};
await page.screenshot({path: OUT.replace('.json', '.png'), fullPage: false});
fs.writeFileSync(OUT, JSON.stringify(log, null, 1));
console.log('FIN steps=', log.steps.length, 'jsErr=', log.jsErrors.length, 'sesion=', log.sessionId);
await browser.close();

// --- claves derivadas de content/packs/budget-line/questions.yaml -------------
function _k() {}
