/**
 * Aplica schema local — requiere DATABASE_URL (nunca commitear credenciales).
 * Uso: DATABASE_URL="postgresql://..." node apps/nucleo/scripts/init_db.cjs
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDb() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error('Falta DATABASE_URL — obtén la connection string en Supabase Dashboard → Settings → Database');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database.');

    const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDb();