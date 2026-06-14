import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { z } from 'zod';

const envPath = './.env.local';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      env[key] = value;
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Recreate the Zod schemas from lib/shop/products.ts
const LoteJoinSchema = z.object({
  blockchain_hash: z.string().nullable(),
  cosecha_ids: z.array(z.string()).nullable(),
  nombre_lote: z.string().nullable(),
  descripcion: z.string().nullable(),
  fecha_envasado: z.string().nullable(),
});

const ProductRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().nullable(),
  nombre: z.string().nullable(),
  descripcion_regenerativa: z.string().nullable(),
  precio: z.number().nullable(),
  stock: z.number().nullable(),
  formato: z.string().nullable(),
  fotos: z.array(z.string()).nullable(),
  visible: z.boolean().nullable(),
  sustituye_azucar_g: z.number().nullable(),
  co2_evitado_kg: z.number().nullable(),
  irr_referencia: z.number().nullable(),
  lote_id: z.string().nullable(),
  lotes: LoteJoinSchema.nullable(),
});

async function run() {
  // Select matching the PRODUCT_SELECT fields from lib/shop/products.ts
  const { data, error } = await supabase
    .from('productos')
    .select('id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, visible, sustituye_azucar_g, co2_evitado_kg, irr_referencia, lote_id, lotes(blockchain_hash, cosecha_ids, nombre_lote, descripcion, fecha_envasado)')
    .eq('visible', true);
  
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }
  
  console.log("Total products fetched with SELECT:", data.length);
  for (const row of data) {
    console.log("\nTesting product:", row.nombre);
    const parsed = ProductRowSchema.safeParse(row);
    if (!parsed.success) {
      console.error("Schema validation failed!");
      console.error(JSON.stringify(parsed.error.flatten(), null, 2));
    } else {
      console.log("Schema validation PASSED!");
      console.log(parsed.data);
    }
  }
}

run();
