/**
 * Script para importar productos desde CSV de Shopify a Supabase
 * 
 * Uso:
 * 1. Copiar products_export.csv a la raíz de api/
 * 2. Ejecutar: tsx utils/import-shopify-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno: SUPABASE_URL y SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

async function importProducts() {
  const csvPath = resolve(process.cwd(), 'products_export.csv');
  
  console.log('📦 Leyendo CSV de Shopify...');
  const csvContent = readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.error('❌ CSV vacío o sin filas');
    return;
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  console.log('📋 Headers encontrados:', headers);
  
  const idx = {
    handle: headers.indexOf('handle'),
    title: headers.indexOf('title'),
    body: headers.indexOf('body (html)'),
    vendor: headers.indexOf('vendor'),
    type: headers.indexOf('type'),
    tags: headers.indexOf('tags'),
    published: headers.indexOf('published'),
    variantPrice: headers.indexOf('variant price'),
    variantSku: headers.indexOf('variant sku'),
    variantGrams: headers.indexOf('variant grams'),
    variantInventoryTracker: headers.indexOf('variant inventory tracker'),
    imageSrc: headers.indexOf('image src'),
  };
  
  console.log('Índices:', idx);
  
  const products = new Map<string, any>();
  
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]!);
    const handle = cols[idx.handle]?.trim();
    
    if (!handle || !cols[idx.title]?.trim()) continue;
    
    const title = cols[idx.title]?.replace(/^"|"$/g, '').trim();
    const body = cols[idx.body]?.replace(/^"|"$/g, '').replace(/<[^>]*>/g, '').trim();
    const price = parseFloat(cols[idx.variantPrice]) || 0;
    const sku = cols[idx.variantSku]?.trim();
    const imageSrc = cols[idx.imageSrc]?.trim();
    const tags = cols[idx.tags]?.split(',').map(t => t.trim()).filter(Boolean) || [];
    
    // Solo procesar si es la primera vez que vemos este handle
    if (!products.has(handle)) {
      products.set(handle, {
        nombre: title,
        descripcion_regenerativa: body || null,
        precio: Math.round(price * 1000), // Convertir a CLP
        stock: null,
        formato: null,
        fotos: imageSrc ? [imageSrc] : [],
        visible: cols[idx.published] === 'true',
        slug: slugify(title),
        tags,
      });
    } else if (imageSrc) {
      // Agregar imagen adicional si existe
      const product = products.get(handle);
      if (!product.fotos.includes(imageSrc)) {
        product.fotos.push(imageSrc);
      }
    }
  }
  
  console.log(`\n📦 Total de productos únicos: ${products.size}`);
  
  // Insertar en Supabase
  const productsArray = Array.from(products.values());
  let successCount = 0;
  let errorCount = 0;
  
  console.log('\n🔄 Insertando en Supabase...');
  
  for (const product of productsArray) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .insert(product)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error insertando "${product.nombre}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Insertado: ${product.nombre}`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`❌ Error "${product.nombre}":`, err.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 Resumen:');
  console.log(`  ✅ Exitosos: ${successCount}`);
  console.log(`  ❌ Errores: ${errorCount}`);
  
  // Guardar log
  writeFileSync('import-log.json', JSON.stringify({ success: successCount, errors: errorCount, products: productsArray }, null, 2));
}

importProducts().catch(console.error);
