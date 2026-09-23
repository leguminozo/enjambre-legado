'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiFetch } from '@/hooks/use-api-fetch'
import { prepareImageForUpload, resolveFileMime } from '@/lib/process-image'
import { CMS_SECTION_KEYS, type CmsSectionKey } from '@/lib/editor-tienda-sections'
import { supabase } from '@/lib/supabase'

export interface CMSContentItem {
  id: string
  section_key: string
  item_order: number
  content: Record<string, unknown>
  is_active: boolean
  created_at: string | null
  updated_at: string | null
  /** Ediciones pendientes de publicar (migración 1000); null = sin borrador */
  draft_content: Record<string, unknown> | null
  published_at: string | null
  /**
   * es|en (migración 1001). La DB remota la aplica con supabase db push; los
   * consumidores usan `?? 'es'` como fallback hasta entonces (los rows legacy
   * no traen la columna).
   */
  locale?: string
}

export interface CMSGroupedData {
  [sectionKey: string]: CMSContentItem[]
}

/** Alineado a BFF cms SECTION_KEYS. Sin hero/footer legacy (no consumidos por tienda). */
const CMS_SECTIONS = CMS_SECTION_KEYS

export type CMSSectionKey = CmsSectionKey

export function useCMSContent() {
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()

  const allQuery = useQuery<{ data: CMSGroupedData; sections: string[] }>({
    queryKey: ['cms', 'sections'],
    queryFn: async () => {
      const res = await apiFetch('/api/cms/sections')
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { message?: string; code?: string } | null
        const detail = err?.message || err?.code || res.statusText || String(res.status)
        throw new Error(
          res.status === 403
            ? `Sin permiso para el CMS (${detail}). ¿Tu perfil es admin?`
            : `No se pudo cargar el CMS: ${detail}`,
        )
      }
      return res.json()
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const createItem = useMutation({
    mutationFn: async (item: {
      section_key: CMSSectionKey
      item_order?: number
      content: Record<string, unknown>
      is_active?: boolean
      /** es|en (default es) — "crear desde ES" usa en para clonar la sección */
      locale?: 'es' | 'en'
    }) => {
      const res = await apiFetch('/api/cms/items', {
        method: 'POST',
        body: JSON.stringify({
          section_key: item.section_key,
          item_order: item.item_order ?? 0,
          content: item.content,
          is_active: item.is_active ?? true,
          locale: item.locale ?? 'es',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Create failed' }))
        throw new Error(err.message ?? 'Create failed')
      }
      return res.json() as Promise<{
        data: CMSContentItem
        revalidated?: boolean
        revalidate_reason?: string | null
      }>
    },
    onSuccess: (res) => {
      // Actualización optimista al caché: evita refetch por item.
      // La subida múltiple hace N creates seguidos; un único refetch
      // al final (ver handleUploadMultipleImages) sincroniza la verdad.
      queryClient.setQueryData<{ data: CMSGroupedData; sections: string[] }>(
        ['cms', 'sections'],
        (old) => {
          if (!old) return old
          const newGrouped = { ...old.data }
          const key = res.data.section_key
          if (newGrouped[key]) {
            newGrouped[key] = [...newGrouped[key], res.data].sort(
              (a, b) => (a.item_order ?? 0) - (b.item_order ?? 0)
            )
          } else {
            newGrouped[key] = [res.data]
          }
          return { ...old, data: newGrouped }
        }
      )
    },
  })

  const updateItem = useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string
      item_order?: number
      content?: Record<string, unknown>
      is_active?: boolean
      expected_updated_at?: string | null
    }) => {
      const res = await apiFetch(`/api/cms/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Update failed' })) as {
          message?: string
          code?: string
        }
        if (res.status === 409) {
          // Otro operador ganó: recargar lo vigente para que el operador
          // compare y el segundo guardado sea un overwrite explícito.
          void queryClient.invalidateQueries({ queryKey: ['cms'] })
        }
        throw new Error(err.message ?? 'Update failed')
      }
      return res.json() as Promise<{
        data: CMSContentItem
        revalidated?: boolean
        revalidate_reason?: string | null
      }>
    },
    onSuccess: (res) => {
      // Optimista sin invalidate inmediato: evita refetch en cascada
      // durante ediciones seguidas; el refetch explícito lo hace el llamador.
      queryClient.setQueryData<{ data: CMSGroupedData; sections: string[] }>(
        ['cms', 'sections'],
        (old) => {
          if (!old) return old
          const newGrouped = { ...old.data }
          let found = false
          for (const key of Object.keys(newGrouped)) {
            const items = newGrouped[key]
            const index = items.findIndex((item) => item.id === res.data.id)
            if (index !== -1) {
              const newItems = [...items]
              newItems[index] = res.data
              newGrouped[key] = newItems
              found = true
              break
            }
          }
          if (!found) {
            const key = res.data.section_key
            if (newGrouped[key]) {
              newGrouped[key] = [...newGrouped[key], res.data]
            } else {
              newGrouped[key] = [res.data]
            }
          }
          return { ...old, data: newGrouped }
        }
      )
    },
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/cms/items/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Delete failed' }))
        throw new Error(err.message ?? 'Delete failed')
      }
      return res.json() as Promise<{
        data: { deleted: boolean }
        revalidated?: boolean
        revalidate_reason?: string | null
      }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
    },
  })

  const reorderItems = useMutation({
    mutationFn: async (items: Array<{ id: string; item_order: number }>) => {
      const res = await apiFetch('/api/cms/reorder', {
        method: 'POST',
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Reorder failed' }))
        throw new Error(err.message ?? 'Reorder failed')
      }
      return res.json() as Promise<{
        data: { reordered: number }
        revalidated?: boolean
        revalidate_reason?: string | null
      }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
    },
  })

  /** Publica borradores (draft_content → content). Vacío = todo; o por sección/id. */
  const publishItems = useMutation({
    mutationFn: async (scope?: { section_key?: CMSSectionKey; id?: string }) => {
      const res = await apiFetch('/api/cms/publish', {
        method: 'POST',
        body: JSON.stringify(scope ?? {}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Publish failed' }))
        throw new Error(err.message ?? 'Publish failed')
      }
      return res.json() as Promise<{
        data: { published: number }
        revalidated?: boolean
        revalidate_reason?: string | null
      }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
    },
  })

  /** Descarta borradores (draft_content = null). Por id o sección. */
  const discardItem = useMutation({
    mutationFn: async (scope: { id?: string; section_key?: CMSSectionKey }) => {
      const res = await apiFetch('/api/cms/discard', {
        method: 'POST',
        body: JSON.stringify(scope),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Discard failed' }))
        throw new Error(err.message ?? 'Discard failed')
      }
      return res.json() as Promise<{ data: { discarded: number } }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
    },
  })

  const uploadImage = useMutation({
    mutationFn: async ({
      file,
      sectionKey,
      fieldName,
    }: {
      file: File
      sectionKey: CMSSectionKey
      fieldName: string
    }) => {
      const allowedTypes = new Set([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
      ])
      const maxBytes = 50 * 1024 * 1024 // 50MB pre-process
      const mime = resolveFileMime(file)

      if (!mime || !allowedTypes.has(mime)) {
        throw new Error('Tipo no permitido. Usa PNG (transparente), SVG, WEBP, JPEG o GIF.')
      }
      if (file.size > maxBytes) {
        throw new Error('El archivo supera el tamaño máximo permitido (50MB)')
      }

      // Logos → PNG con alpha; productos/otros → WEBP optimizado
      const optimized = await prepareImageForUpload(file, { fieldName })
      const contentType = resolveFileMime(optimized) || optimized.type || mime
      const ext =
        optimized.name.split('.').pop()?.toLowerCase() ||
        (contentType === 'image/png'
          ? 'png'
          : contentType === 'image/svg+xml'
            ? 'svg'
            : contentType === 'image/webp'
              ? 'webp'
              : 'bin')
      const path = `cms/${sectionKey}/${crypto.randomUUID()}.${ext}`

      const { error: uploadErr } = await supabase.storage.from('cms').upload(path, optimized, {
        upsert: true,
        contentType,
        cacheControl: '31536000',
      })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('cms').getPublicUrl(path)
      return { publicUrl: urlData?.publicUrl ?? '', path, fieldName }
    },
  })

  return {
    data: allQuery.data,
    sections: CMS_SECTIONS,
    isLoading: allQuery.isLoading,
    error: allQuery.error,
    refetch: allQuery.refetch,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    publishItems,
    discardItem,
    uploadImage,
  }
}

export interface CMSContentVersion {
  id: string
  section_key: string
  item_id: string | null
  content: Record<string, unknown>
  draft_content: Record<string, unknown> | null
  changed_by: string | null
  created_at: string
}

/**
 * Historial de versiones del CMS (tabla cms_content_versions). Cada guardado,
 * publicación y descarte conserva el estado previo; restaurar también deja
 * su propia versión, así que toda acción es reversible.
 */
export function useCmsVersions(sectionKey?: string, itemId?: string) {
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()

  const params = new URLSearchParams()
  if (sectionKey) params.set('section_key', sectionKey)
  if (itemId) params.set('item_id', itemId)
  const queryString = params.toString()

  const listQuery = useQuery<{ data: CMSContentVersion[] }>({
    queryKey: ['cms', 'versions', sectionKey ?? null, itemId ?? null],
    queryFn: async () => {
      const res = await apiFetch(`/api/cms/versions${queryString ? `?${queryString}` : ''}`)
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { message?: string } | null
        throw new Error(err?.message || 'No se pudo cargar el historial')
      }
      return res.json()
    },
    staleTime: 30_000,
  })

  const restore = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await apiFetch(`/api/cms/versions/${versionId}/restore`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Restore failed' }))
        throw new Error(err.message ?? 'Restore failed')
      }
      return res.json() as Promise<{
        data: CMSContentItem
        revalidated?: boolean
        revalidate_reason?: string | null
      }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
    },
  })

  return { ...listQuery, restore }
}
