import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const OUT = '/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-'))
  .sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64',
  'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe,
  args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
const net = [];
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('request', r => {
  const u = r.url();
  if (u.includes('/api/')) net.push({m:r.method(), u:u.replace('http://localhost:57330',''), body: r.postData()||null, t: Date.now()});
});
const respBodies = [];
page.on('response', async r => {
  const u = r.url();
  if (u.includes('/api/') && (u.includes('/next') || u.includes('/answer'))) {
    let b=null; try { b = await r.text(); } catch(e){}
    respBodies.push({u:u.replace('http://localhost:57330',''), status:r.status(), body:(b||'').slice(0,400)});
  }
});
await page.goto('http://localhost:57330/?lang=es', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
console.log('CARGA LIMPIA OK. duracion=', await page.evaluate('window.__tutoria.media.duration()'));

const dockTxt = () => page.evaluate(() => Array.from(document.querySelectorAll('.dock *'))
  .filter(n=>n.children.length===0 && n.textContent.trim())
  .map(n=>n.className+' :: '+n.textContent.trim()).join('\n'));

// arrancar practica
await page.evaluate(() => { window.__tutoria.practice.start(); return 1; });
await page.waitForSelector('.q', {timeout:15000});
await page.waitForTimeout(800);

// ---- ITEM #0
let enun = await page.$eval('.q-enunciado', n=>n.textContent.trim());
let cls  = await page.$eval('.q', n=>n.className);
console.log('\nITEM#0 clase=', cls, '\n  enunciado=', enun);
const opts = await page.$$('.q-opciones button');
console.log('  opciones=', opts.length);
if (opts.length) { await opts[0].click(); }
await page.waitForTimeout(1500);

// ---- ITEM #1 (esperar manip)
await page.waitForSelector('.q-manip', {timeout:15000});
await page.waitForTimeout(600);
enun = await page.$eval('.q-manip .q-enunciado', n=>n.textContent.trim());
console.log('\nITEM#1 clase=', await page.$eval('.q', n=>n.className), '\n  enunciado=', enun);
await page.screenshot({path: OUT+'/antes.png'});

const dockAntes = await dockTxt();
const netAntes = net.length;
console.log('\n--- DOCK ANTES ---\n'+dockAntes);
console.log('--- peticiones API hasta ahora:', netAntes);

// telemetria: interceptar eventos
await page.evaluate(() => {
  window.__evs = [];
  const of = window.fetch;
  window.fetch = function(...a){
    try { if (String(a[0]).includes('/event') || String(a[0]).includes('telemetr')) window.__evs.push({u:String(a[0]), b:a[1]&&a[1].body}); } catch(e){}
    return of.apply(this, a);
  };
});

// ---- PULSAR "Listo" SIN ARRASTRAR
const btn = await page.$('.q-manip button.primario');
console.log('\nboton=', await btn.evaluate(n=>n.textContent), 'disabled=', await btn.evaluate(n=>n.disabled));
await btn.click();
await page.waitForTimeout(3000);

const dockDespues = await dockTxt();
console.log('\n--- DOCK DESPUES ---\n'+dockDespues);
console.log('\nIGUAL EL DOCK? ', dockAntes === dockDespues);
await page.screenshot({path: OUT+'/despues.png'});

const nuevas = net.slice(netAntes);
console.log('\n--- PETICIONES API TRAS PULSAR LISTO ---');
for (const n of nuevas) console.log('  ', n.m, n.u, n.body?('body='+n.body.slice(0,200)):'');
console.log('  POST /answer tras Listo:', nuevas.filter(x=>x.m==='POST'&&x.u.includes('/answer')).length);

const evs = await page.evaluate('window.__evs');
console.log('\n--- eventos telemetria capturados:', JSON.stringify(evs).slice(0,800));

// estado actual de la pregunta
const q2 = await page.$('.q');
if (q2) {
  console.log('\nPREGUNTA AHORA: clase=', await q2.evaluate(n=>n.className));
  console.log('  enunciado=', await page.$eval('.q-enunciado', n=>n.textContent.trim()));
  const b2 = await page.$('.q-manip button.primario');
  console.log('  boton Listo presente=', !!b2, 'disabled=', b2? await b2.evaluate(n=>n.disabled) : 'n/a');
} else console.log('\nNO HAY .q EN PANTALLA');

fs.writeFileSync(OUT+'/resp.json', JSON.stringify(respBodies,null,1));
console.log('\n--- ULTIMAS RESPUESTAS ---');
for (const r of respBodies.slice(-6)) console.log('  ', r.u, r.status, r.body.slice(0,220));

await browser.close();
