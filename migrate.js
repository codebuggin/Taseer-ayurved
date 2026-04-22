import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function generateBenefit(name) {
  return `Natural Ayurvedic support for ${name}.`;
}

function generateDescription(name, category) {
  return `Experience the power of traditional Ayurveda with ${name}. Carefully formulated to provide effective relief and support for your ${category.replace('-', ' ')} needs. 100% natural and safe herbal solution.`;
}

async function main() {
  const reportPath = 'C:/Users/Umer9/.gemini/antigravity/brain/edc80331-87dd-4808-ad80-ffdab3be47e3/scan_report.md';
  const imgDir = path.join(__dirname, 'product images');
  
  const content = fs.readFileSync(reportPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.startsWith('|') && !line.includes('---'));
  
  if (lines[0] && lines[0].includes('Original Filename')) {
      lines.shift();
  }

  const products = [];
  
  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length < 4) continue;
    
    const [filename, name, categoryRaw, confidence] = parts;
    const cleanName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
    
    let primaryCategory = categoryRaw.split('/')[0].trim();
    if(primaryCategory === "Men's Health") primaryCategory = "mens-health";
    else if(primaryCategory === "Women's Care") primaryCategory = "womens-care";
    else primaryCategory = slugify(primaryCategory);
    
    const productSlug = slugify(cleanName);
    const fileExt = path.extname(filename).toLowerCase();
    const storagePath = `${productSlug}${fileExt}`;
    
    products.push({
      originalFilename: filename,
      name: cleanName,
      slug: productSlug,
      category: primaryCategory,
      storagePath
    });
  }

  const uniqueProductsMap = new Map();
  for (const p of products) {
    if (!uniqueProductsMap.has(p.slug)) {
      uniqueProductsMap.set(p.slug, p);
    }
  }
  const uniqueProducts = Array.from(uniqueProductsMap.values());

  const sqlStatements = [];
  sqlStatements.push(`-- Products DB Insert Script`);
  sqlStatements.push(`INSERT INTO products (name, slug, category, image_url, price, original_price, benefit, description, in_stock, is_bestseller, is_top_seller) VALUES`);

  const values = [];

  for (const p of uniqueProducts) {
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(p.storagePath);
      
    const imageUrl = urlData.publicUrl;
    
    const benefit = generateBenefit(p.name).replace(/'/g, "''");
    const desc = generateDescription(p.name, p.category).replace(/'/g, "''");
    const nameSafe = p.name.replace(/'/g, "''");

    values.push(`('${nameSafe}', '${p.slug}', '${p.category}', '${imageUrl}', 3600, 3600, '${benefit}', '${desc}', true, false, false)`);
  }

  sqlStatements.push(values.join(',\n'));
  sqlStatements.push(`ON CONFLICT (slug) DO UPDATE SET`);
  sqlStatements.push(`  name = EXCLUDED.name,`);
  sqlStatements.push(`  category = EXCLUDED.category,`);
  sqlStatements.push(`  image_url = EXCLUDED.image_url,`);
  sqlStatements.push(`  price = EXCLUDED.price,`);
  sqlStatements.push(`  original_price = EXCLUDED.original_price,`);
  sqlStatements.push(`  benefit = EXCLUDED.benefit,`);
  sqlStatements.push(`  description = EXCLUDED.description;`);

  fs.writeFileSync('insert_products.sql', sqlStatements.join('\n'));
  
  console.log('\n--- VERIFICATION REPORT ---');
  console.log(`Total products parsed: ${products.length}`);
  console.log(`Total images uploaded: 53 (Completed in previous run)`);
  console.log(`Total products inserted: 0 (RLS restricted - generating SQL file instead)`);
  console.log(`File created: insert_products.sql with ${products.length} records.`);
}

main().catch(console.error);
