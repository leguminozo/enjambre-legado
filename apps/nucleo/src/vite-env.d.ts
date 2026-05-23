/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** URL base del BFF (`apps/api`). Obligatoria en producción. */
  readonly VITE_API_URL?: string;
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
