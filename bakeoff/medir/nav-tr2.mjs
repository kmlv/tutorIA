import {abrir} from './nav-lib.mjs';
const {browser,page} = await abrir('http://localhost:57330/?lang=es');
const tr = await page.evaluate(()=>window.__tutoriaSesion.media.transcript);
for (const marca of [87.045, 123.864, 176.128, 144.761, 194.551]) {
  const seg = tr.find(x=>x.start_s<=marca && marca<x.end_s) || tr.filter(x=>x.start_s<=marca).slice(-1)[0];
  console.log(`\nt=${marca}: segmento [${seg.start_s}–${seg.end_s}] "${seg.text}"`);
  console.log(`   ¿empieza justo aquí? ${Math.abs(seg.start_s-marca)<0.2}`);
}
await browser.close();
