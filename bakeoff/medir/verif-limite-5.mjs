import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {chromium} from 'playwright-core';
const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const d = fs.readdirSync(base).filter(x=>x.startsWith('chromium-')).sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]).pop();
const exe = path.join(base,d,'chrome-mac-arm64','Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({executablePath: exe, args:['--autoplay-policy=no-user-gesture-required']});
const page = await (await browser.newContext({viewport:{width:1280,height:860}})).newPage();
const evPosts=[];
page.on('request', r=>{ if(r.method()==='POST' && /\/events$/.test(new URL(r.url()).pathname)){ try{evPosts.push(JSON.parse(r.postData()||'{}'));}catch{} }});
await page.goto('http://localhost:57330/?lang=es',{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__tutoria && window.__tutoria.media.duration() > 0',null,{timeout:30000});
await page.locator('#ask').first().click(); await page.waitForTimeout(400);
const inp=page.locator('.composer-input');
async function esperarTutor(n){await page.waitForFunction(`(()=>{const a=[...document.querySelectorAll('.dock-body > *')];return a.length>=${n}&&a[a.length-1].className.includes('tutor');})()`,null,{timeout:40000});await page.waitForTimeout(250);}
const qs=['a1','b2','c3','d4','e5','f6','g7','h8','i9','j10','k11','l12'];
for(let i=0;i<12;i++){await inp.click({force:true});await inp.fill('pregunta '+qs[i]);await page.keyboard.press('Enter');await esperarTutor((i+1)*2);}
console.log('chat.asked tras 12 legitimas:', evPosts.filter(e=>e.type==='chat.asked').length);
for(const t of ['pasada 1','pasada 2','pasada 3']){ await page.keyboard.type(t); await page.keyboard.press('Enter'); await page.waitForTimeout(3200); }
const asked=evPosts.filter(e=>e.type==='chat.asked');
console.log('chat.asked TOTAL tras 3 intentos pasados del limite:', asked.length);
console.log('ultimos 4 eventos chat.asked:', JSON.stringify(asked.slice(-4)));
// screenshot recortado del dock con la caja atenuada y enfocada
const dock = await page.locator('.dock').boundingBox();
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/E-dock.png', clip:{x:dock.x,y:dock.y+dock.height-300,width:dock.width,height:300}});
await browser.close();
