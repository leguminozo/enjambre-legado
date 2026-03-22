import { createClient } from '@supabase/supabase-js';
import { colmenas, arbolesPlantados, products } from '../src/data/mockData';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using the secret key for migration

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log('🚀 Starting migration...');

    // 1. Migrate Arboles
    console.log('🌳 Migrating trees...');
    const { data: trees, error: treeError } = await supabase
        .from('arboles_plantados')
        .upsert(arbolesPlantados.map(a => ({
            especie: a.especie,
            cantidad: a.cantidad,
            fecha: a.fecha,
            sector: a.sector,
            lat: a.coordenadas.lat,
            lng: a.coordenadas.lng,
            co2_ton: a.co2_ton,
            status: a.status
        })));
    if (treeError) console.error('Error migrating trees:', treeError);

    // 2. Migrate Colmenas (Simplified for now)
    console.log('🐝 Migrating colmenas...');
    for (const c of colmenas) {
        const { data: colmenaData, error: colmenaError } = await supabase
            .from('colmenas')
            .upsert({
                name: c.name,
                health: c.health,
                queen: c.queen,
                last_inspection: c.lastInspection,
                production_total: c.production,
                floracion: c.floracion,
                notes: c.notes,
                alzas: c.alzas,
                nucleos_candidatos: c.nucleosCandidatos,
                blockchain_hash: c.blockchainHash,
                lote_activo: c.loteActivo
            })
            .select()
            .single();

        if (colmenaError) {
            console.error(`Error migrating colmena ${c.name}:`, colmenaError);
            continue;
        }

        // 3. Migrate Inspecciones for this colmena
        if (c.inspecciones && colmenaData) {
            const { error: inspError } = await supabase
                .from('inspecciones')
                .upsert(c.inspecciones.map(ins => ({
                    colmena_id: colmenaData.id,
                    date: ins.date,
                    inspector: ins.inspector,
                    marcos_cria: ins.marcos_cria,
                    marcos_miel: ins.marcos_miel,
                    varroa: ins.varroa,
                    poblacion: ins.poblacion,
                    reina: ins.reina,
                    enjambrazon_riesgo: ins.enjambrazon_riesgo,
                    notes: ins.notes
                })));
            if (inspError) console.error(`Error migrating inspections for ${c.name}:`, inspError);
        }

        // 4. Migrate Varroa History
        if (c.varroaHistory && colmenaData) {
            const { error: vError } = await supabase
                .from('varroa_records')
                .upsert(c.varroaHistory.map(v => ({
                    colmena_id: colmenaData.id,
                    date: v.date,
                    level: v.level,
                    method: v.method
                })));
            if (vError) console.error(`Error migrating varroa for ${c.name}:`, vError);
        }

        // 5. Migrate Peso History
        if (c.pesoHistory && colmenaData) {
            const { error: pError } = await supabase
                .from('peso_records')
                .upsert(c.pesoHistory.map(p => ({
                    colmena_id: colmenaData.id,
                    date: p.date,
                    kg: p.kg,
                    note: p.note
                })));
            if (pError) console.error(`Error migrating peso for ${c.name}:`, pError);
        }
    }

    console.log('✅ Migration finished!');
}

migrate();
