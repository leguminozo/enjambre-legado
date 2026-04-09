import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig(): { url: string; anonKey: string } {
    const vite = typeof import.meta !== 'undefined' && import.meta.env;
    const vUrl = vite?.VITE_SUPABASE_URL as string | undefined;
    const vKey =
        (vite?.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined) ||
        (vite?.VITE_SUPABASE_ANON_KEY as string | undefined);
    if (vUrl && vKey) return { url: vUrl, anonKey: vKey };

    const nUrl =
        typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : undefined;
    const nKey =
        (typeof process !== 'undefined'
            ? process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
              process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
            : undefined) as string | undefined;
    if (nUrl && nKey) return { url: nUrl, anonKey: nKey };

    return { url: '', anonKey: '' };
}

const { url, anonKey } = getSupabaseConfig();

if (!url || !anonKey) {
    console.warn(
        'Supabase: faltan URL y clave pública (VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY / VITE_SUPABASE_ANON_KEY o NEXT_PUBLIC_*). Modo degradado.'
    );
}

export const supabase = createClient(
    url || 'https://placeholder.supabase.co',
    anonKey || 'placeholder'
);
