const AUTH_BROADCAST_CHANNEL = 'enjambre_auth_sync'
const STORAGE_SYNC_KEY = '__enj_auth_sync_event__'

export type AuthSyncEvent =
  | { type: 'SESSION_UPDATED'; userId: string; role: string; timestamp: number }
  | { type: 'SESSION_REVOKED'; timestamp: number }

let _broadcastChannel: BroadcastChannel | null = null

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null
  if (typeof BroadcastChannel === 'undefined') return null
  if (!_broadcastChannel) {
    try {
      _broadcastChannel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL)
    } catch {
      _broadcastChannel = null
    }
  }
  return _broadcastChannel
}

export function broadcastSessionUpdate(userId: string, role: string): void {
  if (typeof window === 'undefined') return
  const event: AuthSyncEvent = {
    type: 'SESSION_UPDATED',
    userId,
    role,
    timestamp: Date.now(),
  }

  const channel = getBroadcastChannel()
  if (channel) {
    try {
      channel.postMessage(event)
    } catch {
      // Ignorar fallo de canal
    }
  }

  // Fallback con localStorage para navegadores sin BroadcastChannel
  try {
    window.localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(event))
  } catch {
    // Ignorar si storage está deshabilitado
  }
}

export function broadcastSessionRevoke(): void {
  if (typeof window === 'undefined') return
  const event: AuthSyncEvent = {
    type: 'SESSION_REVOKED',
    timestamp: Date.now(),
  }

  const channel = getBroadcastChannel()
  if (channel) {
    try {
      channel.postMessage(event)
    } catch {
      // Ignorar fallo de canal
    }
  }

  try {
    window.localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(event))
  } catch {
    // Ignorar si storage está deshabilitado
  }
}

/**
 * Solicita persistencia de almacenamiento al sistema operativo (iOS WebKit / Android Chromium).
 * Protege IndexedDB (Dexie en Campo) y LocalStorage de purgas automáticas bajo presión de memoria.
 */
export async function ensurePersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false
  }

  try {
    const isAlreadyPersisted = await navigator.storage.persisted()
    if (isAlreadyPersisted) {
      return true
    }
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export interface PwaLifecycleOptions {
  onRefreshRequest?: () => void
  onRevokeSession?: () => void
}

/**
 * Inicializa la sincronización de ciclo de vida en PWA y navegadores:
 * 1. Resurrección al volver de multitarea/segundo plano (visibilitychange / pageshow).
 * 2. Reconexión tras caída de internet (online).
 * 3. Sincronización multiventana instantánea (BroadcastChannel / storage event).
 */
export function initPwaLifecycleSync(options: PwaLifecycleOptions): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}

  const { onRefreshRequest, onRevokeSession } = options
  let lastVisibilityRefresh = Date.now()
  const MIN_VISIBILITY_REFRESH_INTERVAL_MS = 30_000 // 30s mínimo entre checks al cambiar de app

  const handleRefresh = () => {
    const now = Date.now()
    if (now - lastVisibilityRefresh >= MIN_VISIBILITY_REFRESH_INTERVAL_MS) {
      lastVisibilityRefresh = now
      onRefreshRequest?.()
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      handleRefresh()
    }
  }

  const handlePageShow = (event: PageTransitionEvent) => {
    // bfcache restoration o apertura desde multitarea
    if (event.persisted) {
      handleRefresh()
    }
  }

  const handleOnline = () => {
    handleRefresh()
  }

  const handleBroadcastMessage = (event: MessageEvent<AuthSyncEvent>) => {
    const data = event.data
    if (!data || typeof data !== 'object') return

    if (data.type === 'SESSION_REVOKED') {
      onRevokeSession?.()
    } else if (data.type === 'SESSION_UPDATED') {
      onRefreshRequest?.()
    }
  }

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== STORAGE_SYNC_KEY || !event.newValue) return
    try {
      const data = JSON.parse(event.newValue) as AuthSyncEvent
      if (data.type === 'SESSION_REVOKED') {
        onRevokeSession?.()
      } else if (data.type === 'SESSION_UPDATED') {
        onRefreshRequest?.()
      }
    } catch {
      // Ignorar JSON inválido
    }
  }

  // Registrar listeners
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pageshow', handlePageShow)
  window.addEventListener('online', handleOnline)

  const channel = getBroadcastChannel()
  if (channel) {
    channel.addEventListener('message', handleBroadcastMessage)
  }
  window.addEventListener('storage', handleStorageEvent)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pageshow', handlePageShow)
    window.removeEventListener('online', handleOnline)
    if (channel) {
      channel.removeEventListener('message', handleBroadcastMessage)
    }
    window.removeEventListener('storage', handleStorageEvent)
  }
}
