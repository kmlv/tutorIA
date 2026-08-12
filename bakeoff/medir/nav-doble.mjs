import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
const posts=[];
page.on('request', r=>{ if(r.method()==='POST') posts.push(r.url().replace('http://localhost:57330','')+' '+String(r.postData()).slice(0,160)); });
await page.evaluate(()=>window.__tutoria.media.seek(143));
await page.waitForTimeout(500); await page.click('#play');
await page.waitForSelector('.q',{timeout:20000}); await page.waitForTimeout(800);
console.log('cp1 servido');
await page.click('.q-opciones button');   // "Se desplaza hacia afuera, paralela" = correcta
await page.waitForTimeout(3500);
let s = await page.evaluate(SNAP);
console.log('tras responder:', JSON.stringify({t:s.t, paused:s.paused, dock:s.dockEstado, body:(s.dockBody||'').slice(0,220)}));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cp1-resp.png'});
// rebobinar y volver a pasar
await page.evaluate(()=>window.__tutoria.media.seek(142));
await page.waitForTimeout(1200);
s = await page.evaluate(SNAP);
console.log('tras rebobinar a 142:', JSON.stringify({t:s.t, paused:s.paused, play:s.play, dock:s.dockEstado, body:(s.dockBody||'').slice(0,200)}));
await page.click('#play');
await page.waitForTimeout(6000);
s = await page.evaluate(SNAP);
console.log('cp1 otra vez:', JSON.stringify({t:s.t, paused:s.paused, dock:s.dockEstado, nq: await page.evaluate(()=>document.querySelectorAll('.q').length), body:(s.dockBody||'').slice(0,300)}));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cp1-2avez.png'});
console.log('POSTs:', JSON.stringify(posts,null,1));
if(errores.length) console.log('ERRORES', errores);
await browser.close();
