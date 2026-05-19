import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

/**
 * Migración: Agregar tablas de conciliación SumUp
 * 
 * Ejecutar después de: pnpm db:push
 */
async function migrate() {
  console.log('🔧 Migrando: Tablas de conciliación SumUp...');

  try {
    // Verificar si la tabla ya existe
    const tableExists = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'conciliacion_sumup'
      );
    `;

    if (tableExists) {
      console.log('✅ Tabla conciliacion_sumup ya existe');
      return;
    }

    // Crear tabla de conciliación
    await db.$queryRaw`
      CREATE TABLE IF NOT EXISTS conciliacion_sumup (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES empresas(id),
        checkout_id TEXT,
        transaction_id TEXT,
        monto DECIMAL(19,4) NOT NULL,
        comision DECIMAL(19,4) DEFAULT 0,
        neto DECIMAL(19,4) NOT NULL,
        estado TEXT NOT NULL DEFAULT 'PENDIENTE',
        tipo TEXT NOT NULL DEFAULT 'servicio',
        factura_id UUID REFERENCES facturas_emitidas(id),
        observaciones TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_conciliacion_empresa 
      ON conciliacion_sumup(empresa_id);
      
      CREATE INDEX IF NOT EXISTS idx_conciliacion_transaction 
      ON conciliacion_sumup(transaction_id);
      
      CREATE INDEX IF NOT EXISTS idx_conciliacion_factura 
      ON conciliacion_sumup(factura_id);
    `;

    console.log('✅ Tabla conciliacion_sumup creada exitosamente');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

migrate()
  .then(() => {
    console.log('✅ Migración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
