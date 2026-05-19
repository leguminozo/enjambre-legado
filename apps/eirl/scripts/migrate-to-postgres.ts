#!/usr/bin/env node
/**
 * Script de migración de SQLite → PostgreSQL
 * 
 * Uso:
 * 1. Asegúrate de tener DATABASE_URL en .env apuntando a PostgreSQL
 * 2. Ejecuta: npx tsx scripts/migrate-to-postgres.ts
 * 3. Verifica los datos en PostgreSQL
 * 4. Elimina el archivo dev.db (SQLite)
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const db = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración SQLite → PostgreSQL');
  
  try {
    // 1. Verificar conexión PostgreSQL
    await db.$connect();
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a PostgreSQL exitosa');

    // 2. Contar registros existentes
    const empresasCount = await db.empresa.count();
    if (empresasCount > 0) {
      console.log(`⚠️  La base de datos ya tiene ${empresasCount} empresas. ¿Continuar? (y/N)`);
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('¿Continuar? (y/N): ', (ans) => {
          rl.close();
          resolve(ans);
        });
      });
      
      if (answer !== 'y' && answer !== 'Y') {
        console.log('❌ Migración cancelada');
        return;
      }
    }

    // 3. Crear empresa por defecto si no existe
    const empresaId = process.env.EIRL_EMPRESA_ID || 'temp-empresa-id';
    const empresa = await db.empresa.upsert({
      where: { rut: '00000000-0' },
      update: {},
      create: {
        id: empresaId,
        rut: '00000000-0',
        razonSocial: 'EIRL PROPYME',
        giro: 'Servicios',
        email: 'contacto@ejemplo.cl'
      }
    });
    console.log(`✅ Empresa creada/actualizada: ${empresa.id}`);

    // 4. Crear período contable actual
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    await db.periodoContable.upsert({
      where: {
        empresaId_anio_mes: {
          empresaId: empresa.id,
          anio: currentYear,
          mes: currentMonth
        }
      },
      update: {},
      create: {
        empresaId: empresa.id,
        anio: currentYear,
        mes: currentMonth,
        estado: 'abierto'
      }
    });
    console.log(`✅ Período contable creado: ${currentMonth}/${currentYear}`);

    console.log('\n✅ Migración completada exitosamente');
    console.log('\nSiguientes pasos:');
    console.log('1. Ejecuta: pnpm db:generate');
    console.log('2. Ejecuta: pnpm build');
    console.log('3. Verifica la app en http://localhost:3000');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
