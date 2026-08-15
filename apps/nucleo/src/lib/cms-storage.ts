/**
 * Storage de la tienda: el editor sube a bucket `cms` con path
 * `cms/{seccion}/{uuid}.ext` → URL .../public/cms/cms/colecciones/….
 * El listado debe ser recursivo (raíz → cms/ → colecciones/ → archivo).
 */

export const CMS_PUBLIC_PREFIX = "/storage/v1/object/public/cms/";

export type ListedStorageFile = {
  path: string;
  name: string;
  size: number;
  created_at: string | null;
};

export type StorageListEntry = {
  name: string;
  id?: string | null;
  metadata?: { size?: number } | null;
  created_at?: string | null;
};

export const KNOWN_STORAGE_BUCKETS: ReadonlyArray<{
  id: string;
  label: string;
  public: boolean;
}> = [
  { id: "cms", label: "Editor de Tienda", public: true },
  { id: "productos", label: "Catálogo / fichas", public: true },
  { id: "colmenas", label: "Patio / colmenas", public: true },
  { id: "arboles", label: "Trazabilidad árboles", public: true },
  { id: "avatars", label: "Avatares", public: true },
  { id: "fuentes", label: "Fuentes internas", public: false },
  { id: "infusiones-evidencias", label: "Infusiones (evidencia)", public: false },
  { id: "bitacora-audio", label: "Bitácora audio", public: false },
  { id: "certificados-sanitarios", label: "Certificados sanitarios", public: false },
  { id: "sii-documents", label: "SII documentos", public: false },
  { id: "sii-certificados", label: "SII certificados", public: false },
];

export function extractCmsObjectPath(value: string): string | null {
  const idx = value.indexOf(CMS_PUBLIC_PREFIX);
  if (idx === -1) return null;
  const path = value.slice(idx + CMS_PUBLIC_PREFIX.length).split(/[?#]/)[0];
  return path || null;
}

export function extractCmsPaths(value: unknown, acc: Set<string>): void {
  if (typeof value === "string") {
    const path = extractCmsObjectPath(value);
    if (path) acc.add(path);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) extractCmsPaths(v, acc);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) extractCmsPaths(v, acc);
  }
}

export async function walkStorageList(
  list: (prefix: string) => Promise<StorageListEntry[]>,
  prefix = "",
  depth = 0,
): Promise<ListedStorageFile[]> {
  if (depth > 8) return [];
  const images: ListedStorageFile[] = [];
  const page = await list(prefix);
  for (const entry of page) {
    if (!entry.name || entry.name.startsWith(".")) continue;
    const childPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id) {
      images.push({
        path: childPath,
        name: entry.name,
        size: Number(entry.metadata?.size ?? 0),
        created_at: entry.created_at ?? null,
      });
    } else {
      images.push(...(await walkStorageList(list, childPath, depth + 1)));
    }
  }
  return images;
}
