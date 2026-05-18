import { firestore } from '../firebase'
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

const COLLECTION = 'stylePresets'
const LOCAL_KEY = 'localStylePresets'

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

function writeLocal(obj) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(obj))
  } catch (e) {
    // ignore
  }
}

export async function saveStylePreset(name, style) {
  // Firestore path if available
  if (firestore) {
    const col = collection(firestore, COLLECTION)
    const payload = { name: name || 'Unnamed preset', style: style || {}, createdAt: serverTimestamp() }
    const ref = await addDoc(col, payload)
    return { id: ref.id, ...payload }
  }

  // localStorage fallback
  const store = readLocal()
  const id = `local_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const payload = { id, name: name || 'Unnamed preset', style: style || {}, createdAt: new Date().toISOString(), _local: true }
  store[id] = payload
  writeLocal(store)
  return payload
}

export async function listStylePresets() {
  if (firestore) {
    const col = collection(firestore, COLLECTION)
    const snapshot = await getDocs(col)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  const store = readLocal()
  return Object.values(store).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
}

export async function getStylePreset(id) {
  if (firestore) {
    const dref = doc(firestore, COLLECTION, id)
    const snap = await getDoc(dref)
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  }
  const store = readLocal()
  return store[id] || null
}

export async function deleteStylePreset(id) {
  if (firestore) {
    const dref = doc(firestore, COLLECTION, id)
    await deleteDoc(dref)
    return
  }
  const store = readLocal()
  if (store[id]) {
    delete store[id]
    writeLocal(store)
  }
}

export default {
  saveStylePreset,
  listStylePresets,
  getStylePreset,
  deleteStylePreset,
}
