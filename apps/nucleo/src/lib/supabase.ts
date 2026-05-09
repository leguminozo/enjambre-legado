import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig(): { url: string; anonKey: string } {
    // Static access for Vite (required for production builds)
    const vUrl = import.meta.env.VITE_SUPABASE_URL;
    const vKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (vUrl && vKey) return { url: vUrl, anonKey: vKey };

    // Fallback for process.env (Next.js/SSR/Testing)
    const nUrl = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : undefined;
    const nKey = typeof process !== 'undefined' 
        ? (process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        : undefined;

    if (nUrl && nKey) return { url: nUrl as string, anonKey: nKey as string };

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
