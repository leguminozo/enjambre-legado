/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    /** Clave publishable (Supabase nuevo) o anon JWT clásico. */
    readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_PUBLIC_URL_TIENDA?: string;
    readonly VITE_PUBLIC_URL_CAMPO?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
