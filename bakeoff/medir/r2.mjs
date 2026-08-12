import {abrir} from './lib.mjs';
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
const t = await page.evaluate(()=>{
  const bar = document.querySelector('.transporte') || document.querySelector('.controles') || document.querySelector('#play')?.parentElement;
  return {html: bar? bar.outerHTML.slice(0,900):null, inputs: [...document.querySelectorAll('input[type=range], .scrubber, .timeline, progress')].map(e=>e.className||e.tagName)};
});
console.log(JSON.stringify(t,null,1));
await browser.close();
