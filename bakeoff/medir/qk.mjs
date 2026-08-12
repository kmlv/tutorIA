import {abrir} from './lib.mjs';
const {browser,page} = await abrir('http://localhost:57330/?lang=en');
const o = await page.evaluate(()=>({
  dur: window.__tutoria.media.duration(),
  cues: window.__tutoriaSesion.media.cues.map(c=>`${c.t}  ${c.type}  ${c.id}`),
  trans: window.__tutoriaSesion.media.transcript.filter(c=>c.start_s>75 && c.start_s<140).map(c=>`${c.start_s}-${c.end_s}: ${c.text}`)
}));
console.log('dur', o.dur);
console.log(o.cues.join('\n'));
console.log('---transcript 75-140---');
console.log(o.trans.join('\n'));
await browser.close();
