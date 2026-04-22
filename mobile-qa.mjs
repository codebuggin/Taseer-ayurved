import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, 'mobile-qa-screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

(async () => {
  const iPhone = devices['iPhone 12'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    locale: 'en-IN'
  });
  const page = await context.newPage();

  try {
    console.log('TEST 1: HOMEPAGE');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'mobile-home.png'), fullPage: true });

    console.log('TEST 2: HAMBURGER MENU');
    try {
      await page.click('button.lg\\:hidden');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outDir, 'mobile-menu.png') });
    } catch(e) { console.error("TEST 2 failed", e.message); }
    
    console.log('TEST 3: SHOP / FORMULATIONS PAGE');
    await page.goto('http://localhost:5173/shop');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'mobile-shop.png'), fullPage: true });

    console.log('TEST 4: PRODUCT DETAIL PAGE');
    await page.goto('http://localhost:5173/shop');
    await page.waitForTimeout(2000);
    const firstProduct = await page.$('.group'); 
    if (firstProduct) {
      await firstProduct.click();
      await page.waitForTimeout(3000);
    } else {
      await page.goto('http://localhost:5173/shop/thyroid-care'); 
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: path.join(outDir, 'mobile-product.png'), fullPage: true });

    console.log('TEST 5: CART SIDEBAR');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    const addBtn = await page.$('button:has-text("Add to Cart")');
    if (addBtn) await addBtn.click();
    else await page.click('button:has(svg.lucide-shopping-bag)');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'mobile-cart.png') });

    console.log('TEST 6: CHECKOUT PAGE');
    await page.goto('http://localhost:5173/checkout');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'mobile-checkout.png'), fullPage: true });

    console.log('TEST 7: TESTIMONIALS PAGE');
    await page.goto('http://localhost:5173/testimonials');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'mobile-testimonials.png'), fullPage: true });

    console.log('TEST 8: ABOUT PAGE');
    await page.goto('http://localhost:5173/about');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'mobile-about.png'), fullPage: true });
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
    console.log('Done!');
  }
})();
