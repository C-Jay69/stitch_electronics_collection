// Emergent Object Storage helper. Init once, cache storage_key in module scope.
const STORAGE_URL = 'https://integrations.emergentagent.com/objstore/api/v1/storage'
const APP_NAME = process.env.STORAGE_APP_NAME || 'pawplan'

let storageKey = null

async function initStorage() {
  if (storageKey) return storageKey
  const res = await fetch(`${STORAGE_URL}/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emergent_key: process.env.EMERGENT_LLM_KEY }),
  })
  if (!res.ok) {
    const t = await res.text().catch(()=> '')
    throw new Error(`storage init failed ${res.status}: ${t.slice(0,200)}`)
  }
  const data = await res.json()
  storageKey = data.storage_key
  return storageKey
}

export async function putObject(path, buffer, contentType) {
  const key = await initStorage()
  const res = await fetch(`${STORAGE_URL}/objects/${path}`, {
    method: 'PUT',
    headers: { 'X-Storage-Key': key, 'Content-Type': contentType || 'application/octet-stream' },
    body: buffer,
  })
  if (res.status === 403) { storageKey = null; return putObject(path, buffer, contentType) }
  if (!res.ok) {
    const t = await res.text().catch(()=> '')
    throw new Error(`storage put failed ${res.status}: ${t.slice(0,200)}`)
  }
  return res.json()
}

export async function getObject(path) {
  const key = await initStorage()
  const res = await fetch(`${STORAGE_URL}/objects/${path}`, {
    headers: { 'X-Storage-Key': key },
  })
  if (res.status === 403) { storageKey = null; return getObject(path) }
  if (!res.ok) throw new Error(`storage get failed ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return { buffer: buf, contentType: res.headers.get('content-type') || 'application/octet-stream' }
}

export function buildUploadPath(userId, ext) {
  const safeExt = (ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
  const id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  return `${APP_NAME}/uploads/${userId}/${id}.${safeExt}`
}

export const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg','image/png','image/webp','image/gif'])
export const MIME_EXT = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif' }
