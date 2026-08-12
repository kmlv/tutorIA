import {abrir} from './nav-lib.mjs';
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
const out = await page.evaluate(()=>{
  const t = window.__tutoriaSesion.media.transcript;
  return {tipo: Array.isArray(t)?'array':typeof t, keys: Array.isArray(t)?null:Object.keys(t), muestra: JSON.stringify(Array.isArray(t)?t.slice(0,3):t).slice(0,600)};
});
console.log(JSON.stringify(out,null,1));
await browser.close();
