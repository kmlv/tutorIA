import {abrir} from './_lib.mjs';
const {browser, page} = await abrir();
const info = await page.evaluate(() => {
  const s = window.__tutoriaSesion;
  const out = {dur: window.__tutoria.media.duration(), keys: Object.keys(s||{})};
  return out;
});
console.log(JSON.stringify(info,null,1));
await browser.close();
