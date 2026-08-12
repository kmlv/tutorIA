import {abrir, hastaManip} from './manip-lib.mjs';
const {browser, page} = await abrir();
await hastaManip(page);
console.log(JSON.stringify(await page.evaluate(()=>{
  const sl=[...document.querySelectorAll('svg.bgraph [role=slider], svg.bgraph [tabindex="0"]')];
  return sl.map(e=>({tag:e.tagName, role:e.getAttribute('role'), label:e.getAttribute('aria-label'),
    now:e.getAttribute('aria-valuenow'), txt:e.getAttribute('aria-valuetext'),
    min:e.getAttribute('aria-valuemin'), max:e.getAttribute('aria-valuemax')}));
}), null, 1));
console.log('live regions:', JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('[aria-live]')].map(e=>({cls:e.className, live:e.getAttribute('aria-live'), txt:(e.textContent||'').slice(0,80)})))));
await browser.close();
