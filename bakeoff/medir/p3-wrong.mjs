import {open, snap} from './lib-drive.mjs';
const SHOT='/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cps/';
const {browser, page} = await open('http://localhost:57330/?lang=es');
await page.evaluate(()=>{window.__tutoria.media.seek(143); window.__tutoria.media.play();});
await page.waitForSelector('.q .q-opciones button', {timeout:15000});
await page.waitForTimeout(400);
const dockTxt = async () => await page.evaluate(()=>{
  const d=document.querySelector('.dock'); return d? d.innerText.replace(/\n+/g,' | ').trim():'(no dock)';
});
const chips = async () => await page.evaluate(()=>[...document.querySelectorAll('.dock button')].map(b=>b.textContent.trim()+(b.disabled?'[DIS]':'')));
console.log('== llegada ==', await dockTxt());
console.log('chips:', JSON.stringify(await chips()));
for (let round=1; round<=5; round++) {
  const btns = await page.$$('.q-opciones button');
  const enabled = [];
  for (let i=0;i<btns.length;i++) if (!(await btns[i].isDisabled())) enabled.push(i);
  console.log(`\n--- ronda ${round}: botones habilitados = [${enabled}] de ${btns.length}`);
  if (!enabled.length) { console.log('  NO HAY NINGUN BOTON HABILITADO'); break; }
  // pick a wrong one: index 1 ("Se vuelve mas plana"), else first enabled
  const pick = enabled.includes(1) ? 1 : (enabled.includes(2)?2:(enabled.includes(3)?3:enabled[0]));
  console.log('  clic en opcion', pick);
  await btns[pick].click();
  await page.waitForTimeout(1200);
  console.log('  dock:', await dockTxt());
  console.log('  chips:', JSON.stringify(await chips()));
  const st = await snap(page,'r'+round);
  console.log('  t=',st.t,'paused=',st.paused,'dockState=',st.dockState);
  console.log('  qhtml:', st.q ? st.q.html.slice(0,1200) : '(sin .q)');
  await page.screenshot({path:SHOT+`wrong-r${round}.png`});
}
await page.waitForTimeout(8000);
console.log('\n== tras 8s de espera ==');
console.log('  dock:', await dockTxt());
const st = await snap(page,'end'); console.log('  t=',st.t,'paused=',st.paused);
await page.screenshot({path:SHOT+'wrong-final.png', fullPage:false});
await browser.close();
