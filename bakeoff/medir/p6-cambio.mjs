import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,300)));
page.on('dialog', async dl => { console.log('  DIALOG:', dl.type(), JSON.stringify(dl.message())); await dl.dismiss(); });

const S = async (tag) => {
  const o = await page.evaluate(`(()=>{
    const qs=[...document.querySelectorAll('.q')];
    return {url:location.search, t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(),
      dock:window.__tutoria.dock.actual, sess:window.__tutoriaSesion.session_id,
      href:(document.querySelector('.idioma')||{getAttribute:()=>null}).getAttribute('href'),
      nQ:qs.length, respondidas:qs.filter(q=>q.querySelector('.elegida')).length,
      ultima:qs.length? (qs[qs.length-1].querySelector('.q-enunciado')||{}).textContent : null};
  })()`);
  console.log(tag, JSON.stringify(o));
  return o;
};
await page.goto('http://localhost:57330/?lang=es&variant=B', {waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.evaluate('window.__tutoria.media.seek(84); window.__tutoria.media.play()');
await page.waitForSelector('.q', {timeout:20000});
await page.waitForTimeout(500);
await page.click('.q-opciones button');   // answer prediction
await page.waitForTimeout(1200);
await page.evaluate('window.__tutoria.media.paused() && window.__tutoria.media.play()');
await page.evaluate('window.__tutoria.media.seek(142); window.__tutoria.media.play()');
await page.waitForTimeout(6000);
await S('antes cambio  ');
// answer cp1: last .q
const cpBtns = await page.$$('.q');
const last = cpBtns[cpBtns.length-1];
const btns = await last.$$('.q-opciones button');
console.log('  cp1 opciones:', btns.length);
if (btns.length) { await btns[0].click(); await page.waitForTimeout(2500); }
await S('cp1 respondida');
console.log('  DOCK:', (await page.evaluate(`document.querySelector('.dock').innerText`)).replace(/\n/g,' | ').slice(0,700));
// NOW: click language selector
console.log('--- CLICK .idioma ---');
await page.click('.idioma');
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0', null, {timeout:30000});
await page.waitForTimeout(1500);
await S('tras cambiar  ');
console.log('  DOCK:', (await page.evaluate(`document.querySelector('.dock').innerText`)).replace(/\n/g,' | ').slice(0,400));
console.log('  video display:', await page.evaluate(`(()=>{const v=document.querySelector('video'); return v? {src:v.currentSrc.slice(-30), disp:getComputedStyle(v).display, rs:v.readyState}:null})()`));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/tras-cambio.png'});
await browser.close();
