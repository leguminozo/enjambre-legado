import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calendarioTasks } from '../src/data/mockData';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migratePhase2() {
    console.log('🚀 Starting Phase 2 migration...');

    // 1. Calendario Tasks
    if (calendarioTasks && calendarioTasks.length > 0) {
        console.log('📅 Migrating calendario_tasks...');
        const { error: calError } = await supabase
            .from('calendario_tasks')
            .upsert(calendarioTasks.map(t => ({
                id: t.id,
                week: t.week,
                month: t.month,
                category: t.category,
                title: t.title,
                colmena: t.colmena || null,
                priority: t.priority,
                done: t.done,
                notes: t.notes || null
            })));
        if (calError) console.error('Error migrating calendario_tasks:', calError);
    }

    // 2. Mocks for Clientes, Ventas, Cashflow
    console.log('👥 Creating mock clientes...');
    const mockClientes = [
        { id: '11111111-1111-1111-1111-111111111111', name: 'La Reina (Santiago)', type: 'B2B', last_purchase: '2026-02-15', total_spent: 450000, status: 'frecuente' },
        { id: '22222222-2222-2222-2222-222222222222', name: 'Tienda Naturista Ancud', type: 'Retail', last_purchase: '2026-01-20', total_spent: 120000, status: 'activo' },
        { id: '33333333-3333-3333-3333-333333333333', name: 'Exportadora Andes', type: 'Exportación', last_purchase: '2025-11-10', total_spent: 2500000, status: 'activo' }
    ];
    // Since id in schema is TEXT, we can use simple strings like 'cli-1'
    const mockClientesText = mockClientes.map(c => ({ ...c, id: c.id.replace(/-/g, '').slice(0, 10) }));

    const { error: cliError } = await supabase.from('clientes').upsert(mockClientesText);
    if (cliError) console.error('Error with clientes:', cliError);

    console.log('💰 Creating mock cashflow...');
    const cashFlowData = [
        { month: 'Ene', income: 450, expenses: 280 }, { month: 'Feb', income: 620, expenses: 310 },
        { month: 'Mar', income: 580, expenses: 290 }, { month: 'Abr', income: 480, expenses: 350 },
        { month: 'May', income: 320, expenses: 280 }, { month: 'Jun', income: 180, expenses: 250 },
    ];

    // UUIDs for cashflow are auto generated, we just insert if not exists
    // We upsert using month as index... wait, we need to ensure month is unique constraint in supabase but we added UNIQUE in schema!
    for (const cf of cashFlowData) {
        const { error } = await supabase.from('cashflow').upsert(cf, { onConflict: 'month' });
        if (error) console.error('Error with cashflow:', error);
    }

    console.log('✅ Phase 2 migration finished!');
}

migratePhase2();
