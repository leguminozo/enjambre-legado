'use client';

// Re-export del hook del workspace adaptativo (patrón de re-exports de la shell)
export { useWorkspaceLayout } from '@/providers/workspace-layout-provider';
export type {
  WorkspaceLayoutValue,
  Density,
  ContentMode,
} from '@/providers/workspace-layout-provider';
export { CONTENT_NARROW_MAX, CONTENT_MEDIUM_MAX } from '@/providers/workspace-layout-provider';
