import {abrir} from './_lib.mjs';
import {snap, dragTo, ultimoHTML} from './drv.mjs';
const {browser, page} = await abrir();
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
await snap(page,'I1');
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela'}).click();
await page.waitForTimeout(3000);
await snap(page,'I2');
// manip: y->150 (y px 56.625), x->50 (x px 502.6)
await dragTo(page,1,62,56.625);
await dragTo(page,0,502.6,396);
console.log('aria', await page.evaluate(()=>document.querySelector('.lienzo svg').getAttribute('aria-label')));
await page.locator('.q-manip button.primario').last().click();
await page.waitForTimeout(3500);
await snap(page,'I3');
console.log('HTML I3:', await ultimoHTML(page));
await browser.close();
