// ¿Las repeticiones también ocurren si el alumno VE la lección (contesta predicciones y
// checkpoints en su sitio) en vez de saltar al final?
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';

const OUT = process.argv[2] || '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/run-completo.json';
const TEXTO_ABIERTA = 'El intercepto vertical es m/p2 y no depende de p1, asi que subir el precio del cafe no lo mueve: la recta pivota sobre ese punto.';

const CLAVE_MCQ = {
  q_int_mcq: 'm/p2', q_slope_mcq: '-p1/p2', q_feas_mcq: 'Sí, gasta 50 y te sobran 50',
  q_cp1_income_direction: 'Se desplaza hacia afuera, paralela',
  q_cs_p_mcq: 'Pivota: el intercepto del jugo no se mueve y la recta se empina',
  q_eq_mcq: 'p1·x1 + p2·x2 = m', q_eq_mcq_terms: 'Lo que gastas en el bien 1',
  q_predict_line_vs_set: 'Las canastas que gastan exactamente todo el ingreso',
  q_predict_slope_sign: '3 litros',
  q_predict_price_effect: 'Gira: el intercepto del jugo no se mueve',
};
const CLAVE_NUM = {
  q_int_numeric_1: 'm / p2', q_int_numeric_2: 'm / p1', q_slope_numeric: '-p1 / p2',
  q_eq_numeric: '(m - p1*12) / p2', q_cs_m_numeric: '150 / p2',
};

const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dd = fs.readdirSync(base).filter(x => x.startsWith('chromium-'))
  .sort((a, b) => +a.split('-')[1] - +b.split('-')[1]).pop();
const exe = path.join(base, dd, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport: {width: 1280, height: 860}});
const page = await ctx.newPage();
const log = {jsErrors: [], net: [], servidas: [], dockFinal: []};
page.on('pageerror', e => log.jsErrors.push(String(e).slice(0, 300)));
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

async function contestar(etiqueta) {
  await page.waitForTimeout(400);
  const q = await page.evaluate(() => {
    const ps = document.querySelectorAll('.dock-body .pregunta');
    const last = ps[ps.length - 1];
    if (!last) return null;
    return {cls: last.querySelector('.q')?.className || '',
            enunciado: last.querySelector('.q-enunciado')?.textContent || '',
            opciones: Array.from(last.querySelectorAll('.q-opcion')).map(b => b.textContent)};
  });
  if (!q) { console.log(etiqueta, 'SIN PREGUNTA'); return null; }
  const lastNext = [...log.net].reverse().find(n => n.url.endsWith('/next') && n.status);
  const modal = q.cls.includes('q-mcq') ? 'mcq' : q.cls.includes('q-numeric') ? 'numeric'
    : q.cls.includes('q-open') ? 'open' : q.cls.includes('q-manip') ? 'manip' : '?';
  // el qid real lo sacamos del POST /answer que se produce a continuación
  const ultima = page.locator('.dock-body .pregunta').last();
  if (modal === 'mcq') {
    const txts = q.opciones.map(o => o.trim());
    let idx = txts.findIndex(o => Object.values(CLAVE_MCQ).includes(o));
    if (idx < 0) idx = 0;
    await ultima.locator('.q-opcion').nth(idx).click();
  } else if (modal === 'numeric') {
    const st = await page.evaluate(() => window.__tutoria.estado());
    const qid = JSON.parse(lastNext?.body || '{}').question?.id;
    const expr = CLAVE_NUM[qid] || 'm / p2';
    await ultima.locator('.q-input').fill(String(Number(new Function('m', 'p1', 'p2', 'return (' + expr + ')')(st.m, st.p1, st.p2)).toFixed(3)));
    await ultima.locator('button[type=submit]').click();
  } else if (modal === 'open') {
    await ultima.locator('.q-textarea').fill(TEXTO_ABIERTA);
    await ultima.locator('button[type=submit]').click();
  } else if (modal === 'manip') {
    const esPunto = await page.evaluate(() => !!document.querySelector('.punto-manip'));
    const foco = async (k, n) => { await page.locator('.capa-manip rect[role=slider]').first().focus(); for (let i = 0; i < n; i++) await page.keyboard.press(k); };
    if (esPunto) await foco('ArrowLeft', 2);
    else if (/ingreso sube a 150/i.test(q.enunciado)) { await foco('ArrowUp', 50); await foco('ArrowRight', 17); }
    else if (/precio del caf/i.test(q.enunciado)) await foco('ArrowLeft', 8);
    else await foco('ArrowUp', 10);
    await page.waitForTimeout(150);
    await ultima.locator('button.primario').click();
  }
  await page.waitForTimeout(2500);
  console.log(etiqueta, modal, '|', q.enunciado.slice(0, 60));
  return modal;
}

// 1) Ver la lección: pasar por cada predicción y checkpoint y contestarlos EN SU SITIO.
const paradas = [86.0, 122.8, 143.8, 175.0, 193.5];
for (const t of paradas) {
  const antes = await page.evaluate(() => document.querySelectorAll('.dock-body .pregunta').length);
  await page.evaluate((s) => { const m = window.__tutoria.media; m.seek(s); m.play(); }, t);
  try { await page.waitForFunction((n) => document.querySelectorAll('.dock-body .pregunta').length > n, antes, {timeout: 20000}); }
  catch { console.log('t=' + t + ' NO salió pregunta'); continue; }
  await contestar('cue@' + t);
}

// 2) Ahora sí, al final: arranca la práctica.
await page.evaluate(() => { const m = window.__tutoria.media; m.seek(m.duration() - 1.2); m.play(); });

let lastCount = await page.evaluate(() => document.querySelectorAll('.dock-body .pregunta').length);
for (let i = 0; i < 45; i++) {
  let ok = true;
  try { await page.waitForFunction((n) => document.querySelectorAll('.dock-body .pregunta').length > n, lastCount, {timeout: 20000}); }
  catch { ok = false; }
  if (!ok) { console.log('#' + i + ' sin nueva pregunta'); break; }
  lastCount = await page.evaluate(() => document.querySelectorAll('.dock-body .pregunta').length);
  const lastNext = [...log.net].reverse().find(n => n.url.endsWith('/next') && n.status);
  let qid = null; try { qid = JSON.parse(lastNext.body).question?.id; } catch {}
  log.servidas.push(qid);
  await contestar('#' + i + ' ' + qid);
  const dock = await page.evaluate(() => Array.from(document.querySelectorAll('.dock-body > *')).map(n => n.textContent.trim().slice(0, 60)));
  if (dock.some(t => /Eso es todo por ahora/.test(t))) { console.log('>>> CIERRE'); break; }
}

log.sessionId = await page.evaluate(() => window.__tutoriaSesion?.session_id ?? null);
log.dockFinal = await page.evaluate(() => Array.from(document.querySelectorAll('.dock-body > *')).map(n => ({cls: n.className, txt: n.textContent.trim().replace(/\s+/g, ' ').slice(0, 160)})));
fs.writeFileSync(OUT, JSON.stringify(log, null, 1));
console.log('SERVIDAS EN PRÁCTICA:', JSON.stringify(log.servidas));
console.log('sesion', log.sessionId, 'jsErr', log.jsErrors.length);
await browser.close();
