if (
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as any).indexedDB === 'undefined'
) {
  const stubRequest = {
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: undefined,
    error: new Error('indexedDB is not available in this environment')
  } as any

  const stubIndexedDb = {
    open: () => stubRequest,
    deleteDatabase: () => {
      return {
        onerror: null,
        onsuccess: null,
        result: undefined,
        error: new Error('indexedDB is not available in this environment')
      }
    },
    cmp: () => 0
  }

  ;(globalThis as any).indexedDB = stubIndexedDb
}
