import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
const tr = await page.evaluate(()=>{
  const t = window.__tutoriaSesion.media.transcript;
  return (Array.isArray(t)?t:t.segments||t.lines||[]).map(x=>({t:x.t??x.start??x.at, txt:(x.text??x.txt??x.linea??'').slice(0,110)}));
});
for (const marca of [87.045, 123.864, 176.128]) {
  const seg = tr.filter(x=>x.t!==undefined && x.t<=marca+0.05).slice(-1)[0];
  const sig = tr.find(x=>x.t>marca+0.05);
  console.log(`\n--- predicción en t=${marca} ---`);
  console.log('  subtítulo mostrado (inicia en', seg?.t, '):', seg?.txt);
  console.log('  siguiente línea (', sig?.t, '):', sig?.txt);
}
// capturar la 3a prediccion
await page.evaluate(()=>window.__tutoria.media.seek(174));
await page.waitForTimeout(400); await page.click('#play');
await page.waitForSelector('.q',{timeout:20000}); await page.waitForTimeout(1000);
const s = await page.evaluate(SNAP);
console.log('\npredicción price_effect:', JSON.stringify({t:s.t, q:s.q, cap:s.caption},null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/leak3.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
