'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiFetch } from '@/hooks/use-api-fetch'
import { prepareImageForUpload, resolveFileMime } from '@/lib/process-image'
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
  'menu_settings',
  'menu_links',
  'theme_settings',
  'announcement_settings',
  'announcement_slides',
  'footer_settings',
  'footer_social',
  'pwa_nav_settings',
  'pwa_nav_items',
  'brand_assets',
  'landing_layout',
  'catalog_settings',
  'pdp_settings',
  'seo_defaults',
  'contact_settings',
  'campaign_banners',
  'legal_terminos',
  'legal_privacidad',
  'legal_cookies',
  'legal_envio',
  'legal_reembolso',
  'legal_cancelacion',
  'legal_garantia',
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
      const allowedTypes = new Set([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
      ])
      const maxBytes = 10 * 1024 * 1024 // 10MB pre-process
      const mime = resolveFileMime(file)

      if (!mime || !allowedTypes.has(mime)) {
        throw new Error('Tipo no permitido. Usá PNG (transparente), SVG, WEBP, JPEG o GIF.')
      }
      if (file.size > maxBytes) {
        throw new Error('El archivo supera el tamaño máximo permitido (10MB)')
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
