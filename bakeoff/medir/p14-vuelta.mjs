import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await browser.newContext({viewport:{width:1280,height:860}});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  JS ERROR:', String(e).slice(0,200)));
const SP='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';
await page.goto('http://localhost:57330/?lang=es&variant=B&t=228',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
await page.evaluate('window.__tutoria.media.play()'); await page.waitForTimeout(9000);
const rd = async tag => console.log(tag, JSON.stringify(await page.evaluate(`(()=>{const v=document.querySelector('video');return{
 t:+window.__tutoria.media.currentTime().toFixed(1), paused:window.__tutoria.media.paused(),
 play:(document.querySelector('#play')||{}).textContent, video:v?getComputedStyle(v).display:null,
 dock:window.__tutoria.dock.actual, nQ:document.querySelectorAll('.q').length,
 dockVisible:getComputedStyle(document.querySelector('.dock')).display,
 preguntaVisible: (()=>{const q=[...document.querySelectorAll('.q')].pop(); if(!q) return null; const r=q.getBoundingClientRect(); return {w:r.width,h:r.height};})()}})()`)));
await rd('practica  ');
await page.click('#play'); await page.waitForTimeout(2500); await rd('tras Seguir');
await page.screenshot({path:SP+'/B-seguir-practica.png'});
// try to get back
await page.click('#ask'); await page.waitForTimeout(1500); await rd('tras #ask ');
await page.screenshot({path:SP+'/B-ask-tras-seguir.png'});
console.log(' dock innerText:', (await page.evaluate(`document.querySelector('.dock').innerText`)).replace(/\n+/g,' | ').slice(0,400));
// let it run 15s and see if the question comes back
await page.waitForTimeout(1000);
await rd('final     ');
await browser.close();
