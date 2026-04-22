const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

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

  console.log('TEST 1: HOMEPAGE');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'mobile-home.png') });

  console.log('TEST 2: HAMBURGER MENU');
  await page.click('button:has(svg.lucide-menu), nav button:last-of-type');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'mobile-menu.png') });
  
  // Close menu 
  // Let's just reload
  
  console.log('TEST 3: SHOP / FORMULATIONS PAGE');
  await page.goto('http://localhost:5173/shop');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'mobile-shop.png') });

  console.log('TEST 4: PRODUCT DETAIL PAGE');
  // Wait, the slug might be 'thyroid-care-pack' or similar, let's just click the first product
  await page.goto('http://localhost:5173/shop');
  await page.waitForTimeout(1000);
  const firstProduct = await page.$('.group'); 
  if (firstProduct) {
    await firstProduct.click();
    await page.waitForTimeout(1500);
  } else {
    // Falback
    await page.goto('http://localhost:5173/shop/thyroid-care'); // Fallback URL
  }
  await page.screenshot({ path: path.join(outDir, 'mobile-product.png') });

  console.log('TEST 5: CART SIDEBAR');
  // Click 'Add to Cart' somewhere on the page, or just trigger the cart open state via the UI
  // Clicking the cart navbar icon
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  // Add to cart from homepage
  const addBtn = await page.$('button:has-text("Add to Cart")');
  if (addBtn) await addBtn.click();
  else {
    // Just click the cart icon in navbar
    await page.click('button:has(svg.lucide-shopping-bag)');
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'mobile-cart.png') });

  console.log('TEST 6: CHECKOUT PAGE');
  await page.goto('http://localhost:5173/checkout');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'mobile-checkout.png') });

  console.log('TEST 7: TESTIMONIALS PAGE');
  await page.goto('http://localhost:5173/testimonials');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'mobile-testimonials.png') });

  console.log('TEST 8: ABOUT PAGE');
  await page.goto('http://localhost:5173/about');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'mobile-about.png') });

  await browser.close();
  console.log('Done!');
})();
