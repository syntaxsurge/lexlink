const store = new Map<string, string | null>()

function normalize(value: string | null | undefined) {
  if (typeof value === 'string') return value
  return value ?? null
}

async function getItem(key: string) {
  return store.has(key) ? normalize(store.get(key)) : null
}

async function setItem(key: string, value: string | null) {
  store.set(key, normalize(value))
}

async function removeItem(key: string) {
  store.delete(key)
}

async function clear() {
  store.clear()
}

async function getAllKeys() {
  return Array.from(store.keys())
}

async function multiGet(keys: string[]) {
  return keys.map<[string, string | null]>(key => [key, store.get(key) ?? null])
}

async function multiSet(entries: Array<[string, string | null]>) {
  for (const [key, value] of entries) {
    store.set(key, normalize(value))
  }
}

async function multiRemove(keys: string[]) {
  for (const key of keys) {
    store.delete(key)
  }
}

const AsyncStorage = {
  getItem,
  setItem,
  removeItem,
  clear,
  getAllKeys,
  multiGet,
  multiSet,
  multiRemove
}

export default AsyncStorage
export {
  getItem,
  setItem,
  removeItem,
  clear,
  getAllKeys,
  multiGet,
  multiSet,
  multiRemove
}
