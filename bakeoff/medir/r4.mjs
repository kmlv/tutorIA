import {abrir} from './lib.mjs';
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
console.log('ownsStage =', await page.evaluate(()=>window.__tutoria.media.ownsStage));
await browser.close();
