'use client';

/**
 * Import directo (no dynamic ssr:false).
 * El lazy chunk fallaba en prod con ChunkLoadError tras deploys
 * (HTML viejo / SW / hash de chunk desfasado) → pantalla vacía.
 */
import { EditorTiendaView } from '@/views/EditorTiendaView';

export default function EditorTiendaPage() {
  return <EditorTiendaView />;
}
