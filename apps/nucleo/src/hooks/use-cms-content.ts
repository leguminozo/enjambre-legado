'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiFetch } from '@/hooks/use-api-fetch'
import { supabase } from '@/lib/supabase'

export interface CMSContentItem {
  id: string
  section_key: string
  item_order: number
  content: Record<string, unknown>
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface CMSGroupedData {
  [sectionKey: string]: CMSContentItem[]
}

const CMS_SECTIONS = [
  'servicios',
  'talleres',
  'colecciones',
  'footer_branding',
  'footer_nav',
  'footer_legal',
  'hero',
  'nosotros',
  'galeria',
  'contacto',
] as const

export type CMSSectionKey = (typeof CMS_SECTIONS)[number]

export function useCMSContent() {
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()

  const allQuery = useQuery<{ data: CMSGroupedData; sections: string[] }>({
    queryKey: ['cms', 'sections'],
    queryFn: async () => {
      const res = await apiFetch('/api/cms/sections')
      if (!res.ok) throw new Error('Failed to fetch CMS content')
      return res.json()
    },
    staleTime: 30_000,
  })

  const sectionQuery = (key: CMSSectionKey) =>
    useQuery<{ data: CMSContentItem[] }>({
      queryKey: ['cms', 'section', key],
      queryFn: async () => {
        const res = await apiFetch(`/api/cms/sections/${key}`)
        if (!res.ok) throw new Error(`Failed to fetch section ${key}`)
        return res.json()
      },
      enabled: false,
    })

  const createItem = useMutation({
    mutationFn: async (item: {
      section_key: CMSSectionKey
      item_order?: number
      content: Record<string, unknown>
      is_active?: boolean
    }) => {
      const res = await apiFetch('/api/cms/items', {
        method: 'POST',
        body: JSON.stringify({
          section_key: item.section_key,
          item_order: item.item_order ?? 0,
          content: item.content,
          is_active: item.is_active ?? true,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Create failed' }))
        throw new Error(err.message ?? 'Create failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
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
    }) => {
      const res = await apiFetch(`/api/cms/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Update failed' }))
        throw new Error(err.message ?? 'Update failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
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
      return res.json()
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
      return res.json()
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
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      const maxBytes = 10 * 1024 * 1024 // 10MB

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido (solo JPEG, PNG, GIF, WEBP, PDF)')
      }
      if (file.size > maxBytes) {
        throw new Error('El archivo supera el tamaño máximo permitido (10MB)')
      }

      const ext = file.name.split('.').pop()
      const path = `cms/${sectionKey}/${crypto.randomUUID()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('cms')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('cms').getPublicUrl(path)
      return { publicUrl: urlData?.publicUrl ?? '', path, fieldName }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
    },
  })

  return {
    data: allQuery.data,
    sections: CMS_SECTIONS,
    isLoading: allQuery.isLoading,
    error: allQuery.error,
    refetch: allQuery.refetch,
    sectionQuery,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    uploadImage,
  }
}
