import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});

const PRED = [{id:'line_vs_set', t:87.045}, {id:'slope_sign', t:123.864}, {id:'price_effect', t:176.128}];
const results = [];

for (const p of PRED) {
  for (let opt = 0; opt < 3; opt++) {
    const ctx = await browser.newContext({viewport:{width:1280,height:860}});
    const page = await ctx.newPage();
    let net = null; let jsErr = [];
    page.on('pageerror', e => jsErr.push(String(e).slice(0,150)));
    page.on('response', async r => { if (r.url().includes('/answer')) { try { net = JSON.parse(await r.text()); } catch(e){ net = {parseError:String(e)}; } } });
    await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
    await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
    await page.click('#play');
    await page.waitForTimeout(300);
    await page.evaluate(`window.__tutoria.media.seek(${p.t - 2})`);
    if (await page.evaluate('window.__tutoria.media.paused()')) await page.click('#play');
    await page.waitForSelector('.q', {timeout:20000});
    await page.waitForTimeout(600);
    const ops = await page.$$eval('.q-opciones button', bs=>bs.map(b=>b.textContent.trim()));
    const antes = await page.evaluate(() => ({
      dockHTML: document.querySelector('.dock')?.innerHTML || '',
      dockActual: window.__tutoria?.dock?.actual,
    }));
    await page.click(`.q-opciones button:nth-of-type(${opt+1})`);
    await page.waitForTimeout(3000);
    const desp = await page.evaluate(() => ({
      dockHTML: document.querySelector('.dock')?.innerHTML || '',
      dockActual: window.__tutoria?.dock?.actual,
      bodyText: document.body.innerText.replace(/\s+/g,' '),
      paused: window.__tutoria.media.paused(),
      t: window.__tutoria.media.currentTime(),
    }));
    const soc = net?.socratica || '';
    const socHead = soc.trim().slice(0, 28);
    const socEnDOM = socHead ? desp.bodyText.includes(socHead) : null;
    const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0,10);
    results.push({pred:p.id, opt, texto:ops[opt], correcta:net?.correcta, score:net?.score,
      socratica: soc.trim().replace(/\s+/g,' ').slice(0,120),
      socraticaVisibleEnPantalla: socEnDOM, dockActual: desp.dockActual, audioSigue: !desp.paused,
      dockHash: h(desp.dockHTML), dockLen: desp.dockHTML.length, jsErr});
    await ctx.close();
  }
}
console.log('\n===== MATRIZ PREDICCIONES =====');
for (const r of results) {
  console.log(`\n[${r.pred}] opcion ${r.opt+1}: "${r.texto}"`);
  console.log(`   servidor: correcta=${r.correcta} score=${r.score}`);
  console.log(`   socratica devuelta: ${r.socratica ? '"'+r.socratica+'"' : '(ninguna)'}`);
  console.log(`   >> socratica visible en pantalla: ${r.socraticaVisibleEnPantalla}`);
  console.log(`   dock.actual=${r.dockActual}  audio reanudado=${r.audioSigue}  dockHash=${r.dockHash} len=${r.dockLen}  jsErr=${r.jsErr.length}`);
}
// comparacion correcto vs incorrecto por pregunta
console.log('\n===== ¿IDENTICO ACERTAR vs FALLAR? =====');
for (const p of PRED) {
  const g = results.filter(r=>r.pred===p.id);
  const ok = g.find(r=>r.correcta===true), bad = g.filter(r=>r.correcta===false);
  console.log(`${p.id}: correcta=opcion${ok?ok.opt+1:'?'} hash=${ok?.dockHash} | fallos hashes=${bad.map(b=>'op'+(b.opt+1)+':'+b.dockHash).join(', ')}`);
}
fs.writeFileSync('/Users/klopezva/GithubRepos/tutorIA/bakeoff/medir/verif-matriz.json', JSON.stringify(results,null,1));
await browser.close();
