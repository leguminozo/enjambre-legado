// ============================================================================
// saved-videos.ts — Persistencia y Gestión del Archivo Audiovisual de Identidad
// Marca: La Obrera y el Zángano · Enjambre Legado (Chiloé 42°S)
// ============================================================================

import {
  type SubstrateParameters,
  DEFAULT_SUBSTRATE_PARAMS,
} from './identity-substrate-engine';

export type AspectRatioType = '9:16' | '4:5' | '1:1' | '16:9';

export interface SavedVideoProject {
  id: string;
  title: string;
  aspect: AspectRatioType;
  durationSeconds: number;
  params: SubstrateParameters;
  cardOverlayStyle: 'none' | 'full' | 'floating' | 'fog';
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const STORAGE_KEY_SAVED_VIDEOS = 'enjambre:saved-video-projects';

export const INITIAL_SAMPLE_VIDEOS: SavedVideoProject[] = [
  {
    id: 'vid-reologia-ulmo',
    title: 'Reología del Néctar — Lote Ulmo 42°S',
    aspect: '4:5',
    durationSeconds: 15.0,
    params: {
      ...DEFAULT_SUBSTRATE_PARAMS,
      motor: 'reologia_miel',
      palette: 'ambar',
      camera: 'respiracion',
      gravity: 'orbita',
    },
    cardOverlayStyle: 'none',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'vid-enjambre-pecoreo',
    title: 'Enjambre & Pecoreo Austral — Reel Vertical',
    aspect: '9:16',
    durationSeconds: 10.0,
    params: {
      ...DEFAULT_SUBSTRATE_PARAMS,
      motor: 'enjambre_flujo',
      palette: 'selva',
      camera: 'ken_burns',
      gravity: 'curl',
    },
    cardOverlayStyle: 'none',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function getSavedVideos(): SavedVideoProject[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_VIDEOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_VIDEOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SAVED_VIDEOS, JSON.stringify(INITIAL_SAMPLE_VIDEOS));
      return INITIAL_SAMPLE_VIDEOS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAMPLE_VIDEOS;
  } catch {
    return INITIAL_SAMPLE_VIDEOS;
  }
}

export function saveVideoProject(project: SavedVideoProject): SavedVideoProject[] {
  if (typeof window === 'undefined') return [];
  const current = getSavedVideos();
  const idx = current.findIndex((p) => p.id === project.id);
  let updated: SavedVideoProject[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    updated = [
      {
        ...project,
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...current,
    ];
  }
  localStorage.setItem(STORAGE_KEY_SAVED_VIDEOS, JSON.stringify(updated));
  return updated;
}

export function deleteVideoProject(id: string): SavedVideoProject[] {
  if (typeof window === 'undefined') return [];
  const current = getSavedVideos();
  const updated = current.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_SAVED_VIDEOS, JSON.stringify(updated));
  return updated;
}
