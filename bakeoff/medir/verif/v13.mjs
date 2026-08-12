import {abrir} from './_lib.mjs';
import {dragTo} from './drv.mjs';
const {browser, page} = await abrir();
const CORR = {
 'Tu ingreso sube de 100 a 150. ¿Qué le pasa a la línea?':'Se desplaza hacia afuera, paralela',
 'El precio del café sube de 3 a 4. ¿Qué le pasa a la línea?':'Pivota: el intercepto del jugo no se mueve y la recta se empina',
};
const NUM = {
 'Tu ingreso sube de 100 a 150 y los precios no cambian. ¿Cuál es el nuevo intercepto vertical?':'150',
};
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
let vistos = 0, sinCambio = 0;
for (let paso=0; paso<40; paso++) {
  const st = await page.evaluate(()=>{
    const qs=[...document.querySelectorAll('.q')];
    const u=qs.at(-1);
    return {n:qs.length, docH:document.documentElement.scrollHeight, scrollY:Math.round(scrollY),
      cls:u?.className, enun:u?.querySelector('.q-enunciado')?.textContent,
      contestada: u ? !!u.querySelector('button[disabled], .q-ok, .q-hecha') : false,
      fin: document.body.innerText.includes('Has terminado') || document.body.innerText.includes('práctica')};
  });
  if (st.n === vistos) { sinCambio++; if (sinCambio>6) break; await page.waitForTimeout(1500); continue; }
  sinCambio = 0; vistos = st.n;
  console.log(`item ${st.n}`, JSON.stringify({docH:st.docH, scrollY:st.scrollY, cls:st.cls, enun:st.enun?.slice(0,70)}));
  const u = page.locator('.q').last();
  if (st.cls.includes('q-mcq')) {
    const opts = await u.locator('.q-opciones button').allTextContents();
    const t = CORR[st.enun] ?? opts[0];
    await u.locator('.q-opciones button', {hasText:t}).first().click().catch(async()=>{await u.locator('.q-opciones button').first().click();});
  } else if (st.cls.includes('q-numeric')) {
    await u.locator('.q-input').fill(NUM[st.enun] ?? '1');
    await u.locator('button[type=submit]').click();
  } else if (st.cls.includes('q-manip')) {
    await dragTo(page,1,62,90).catch(()=>{});
    await u.locator('button.primario').click();
  } else {
    const html = await u.evaluate(e=>e.outerHTML.slice(0,500));
    console.log('  TIPO DESCONOCIDO:', html);
    const b = u.locator('button').first();
    if (await b.count()) await b.click(); else break;
  }
  await page.waitForTimeout(3500);
}
const fin = await page.evaluate(()=>({docH:document.documentElement.scrollHeight, scrollY:Math.round(scrollY),
  n:document.querySelectorAll('.q').length, innerH:innerHeight,
  lienzoTop:Math.round(document.querySelector('.lienzo').getBoundingClientRect().top),
  cola: document.body.innerText.slice(-300)}));
console.log('FIN:', JSON.stringify(fin,null,1));
await browser.close();
