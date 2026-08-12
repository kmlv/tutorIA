import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base, d, 'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const SCR='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad';

// 1) ?lang=es&t=110 sin variant -> es realmente la A?
{
  const ctx=await browser.newContext({viewport:{width:1280,height:860}});
  const p=await ctx.newPage();
  await p.goto('http://localhost:57330/?lang=es&t=110',{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await p.waitForTimeout(1000);
  console.log('SIN variant:', JSON.stringify(await p.evaluate(()=>({ownsStage:window.__tutoria.media.ownsStage, ct:window.__tutoria.media.currentTime(), reloj:document.querySelector('.reloj')?.textContent, mostrar:window.__tutoria.estado().mostrar}))));
  await ctx.close();
}
// 2) A t=110, pulsar Empezar, muestrear la desincronia
{
  const ctx=await browser.newContext({viewport:{width:1280,height:860}});
  const p=await ctx.newPage();
  await p.goto('http://localhost:57330/?lang=es&variant=A&t=110',{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__tutoria && window.__tutoria.media.duration()>0',null,{timeout:30000});
  await p.waitForTimeout(1000);
  await p.click('#play');
  for (const espera of [2,5,10,15,20]) {
    await p.waitForTimeout(espera*1000 - (espera===2?0:0));
    const s = await p.evaluate(()=>({ct:+window.__tutoria.media.currentTime().toFixed(1), reloj:document.querySelector('.reloj')?.textContent, sub:document.querySelector('.caption-current')?.textContent.trim().slice(0,70), mostrar:window.__tutoria.estado().mostrar}));
    console.log(`  muestra t≈${s.ct}s:`, JSON.stringify(s));
    break;
  }
  // seguir muestreando cada 5s hasta ~25s
  for (let i=0;i<5;i++){
    await p.waitForTimeout(5000);
    const s = await p.evaluate(()=>({ct:+window.__tutoria.media.currentTime().toFixed(1), reloj:document.querySelector('.reloj')?.textContent, sub:document.querySelector('.caption-current')?.textContent.trim().slice(0,70), mostrar:window.__tutoria.estado().mostrar}));
    console.log(`  muestra t≈${s.ct}s:`, JSON.stringify(s));
  }
  await p.screenshot({path:SCR+'/vA-desync-25s.png'});
  await ctx.close();
}
await browser.close();
