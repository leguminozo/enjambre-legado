import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ensurePersistentStorage,
  broadcastSessionUpdate,
  broadcastSessionRevoke,
  initPwaLifecycleSync,
} from './pwa-lifecycle'

describe('pwa-lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('ensurePersistentStorage calls navigator.storage.persist() when available', async () => {
    const persistMock = vi.fn().mockResolvedValue(true)
    const persistedMock = vi.fn().mockResolvedValue(false)

    vi.stubGlobal('navigator', {
      storage: {
        persist: persistMock,
        persisted: persistedMock,
      },
    })

    const result = await ensurePersistentStorage()
    expect(result).toBe(true)
    expect(persistedMock).toHaveBeenCalled()
    expect(persistMock).toHaveBeenCalled()
  })

  it('ensurePersistentStorage returns false if navigator.storage is unsupported', async () => {
    vi.stubGlobal('navigator', {})
    const result = await ensurePersistentStorage()
    expect(result).toBe(false)
  })

  it('initPwaLifecycleSync attaches and cleans up event listeners', () => {
    const docListeners: Record<string, Function> = {}
    const winListeners: Record<string, Function> = {}

    const mockDoc = {
      addEventListener: vi.fn((event: string, fn: Function) => {
        docListeners[event] = fn
      }),
      removeEventListener: vi.fn((event: string) => {
        delete docListeners[event]
      }),
      visibilityState: 'visible',
    }

    const mockWin = {
      addEventListener: vi.fn((event: string, fn: Function) => {
        winListeners[event] = fn
      }),
      removeEventListener: vi.fn((event: string) => {
        delete winListeners[event]
      }),
      localStorage: {
        setItem: vi.fn(),
      },
    }

    vi.stubGlobal('document', mockDoc)
    vi.stubGlobal('window', mockWin)

    const cleanup = initPwaLifecycleSync({})
    expect(mockDoc.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(mockWin.addEventListener).toHaveBeenCalledWith('pageshow', expect.any(Function))

    cleanup()
    expect(mockDoc.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(mockWin.removeEventListener).toHaveBeenCalledWith('pageshow', expect.any(Function))
  })

  it('broadcastSessionRevoke writes event to storage as fallback', () => {
    const setItemSpy = vi.fn()
    vi.stubGlobal('window', {
      localStorage: {
        setItem: setItemSpy,
      },
    })

    broadcastSessionRevoke()
    expect(setItemSpy).toHaveBeenCalledWith(
      '__enj_auth_sync_event__',
      expect.stringContaining('SESSION_REVOKED')
    )
  })

  it('broadcastSessionUpdate writes event to storage as fallback', () => {
    const setItemSpy = vi.fn()
    vi.stubGlobal('window', {
      localStorage: {
        setItem: setItemSpy,
      },
    })

    broadcastSessionUpdate('usr-999', 'admin')
    expect(setItemSpy).toHaveBeenCalledWith(
      '__enj_auth_sync_event__',
      expect.stringContaining('SESSION_UPDATED')
    )
  })
})
