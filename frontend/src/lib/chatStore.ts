/* Offline chat history, persisted in IndexedDB.
 *
 * The backend stays the source of truth. Every successful API read is mirrored
 * here, and when the network is unavailable the app reads from this copy instead.
 */

import type { Session, SessionDetail } from '../types';
import { ApiError } from '../api/client';

const DB_NAME = 'lenny-chat-history';
const DB_VERSION = 1;
const SESSIONS = 'sessions'; // Session list (sidebar)
const DETAILS = 'sessionDetails'; // Full session incl. messages

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SESSIONS)) db.createObjectStore(SESSIONS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(DETAILS)) db.createObjectStore(DETAILS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  // Allow a retry later if opening failed (e.g. private mode quirks).
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

/** Run `fn` inside a transaction and resolve once the transaction commits. */
async function tx<T>(
  stores: string[],
  mode: IDBTransactionMode,
  fn: (t: IDBTransaction) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const req = fn(t);
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export async function saveSessions(sessions: Session[]): Promise<void> {
  // Replace the whole list so sessions deleted on the server disappear locally too.
  await tx([SESSIONS], 'readwrite', (t) => {
    const store = t.objectStore(SESSIONS);
    store.clear();
    for (const s of sessions) store.put(s);
  });
}

export async function loadSessions(): Promise<Session[]> {
  const all = (await tx<Session[]>([SESSIONS], 'readonly', (t) => t.objectStore(SESSIONS).getAll())) ?? [];
  // Match the backend's ordering: most recently updated first.
  return all.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function saveSessionDetail(detail: SessionDetail): Promise<void> {
  // Never persist optimistic placeholder messages.
  const messages = detail.messages.filter((m) => !m.id.startsWith('temp-'));
  await tx([DETAILS], 'readwrite', (t) => {
    t.objectStore(DETAILS).put({ ...detail, messages });
  });
}

export async function loadSessionDetail(id: string): Promise<SessionDetail | undefined> {
  return tx<SessionDetail>([DETAILS], 'readonly', (t) => t.objectStore(DETAILS).get(id));
}

export async function removeSession(id: string): Promise<void> {
  await tx([SESSIONS, DETAILS], 'readwrite', (t) => {
    t.objectStore(SESSIONS).delete(id);
    t.objectStore(DETAILS).delete(id);
  });
}

/**
 * Network-first read with IndexedDB fallback.
 * On success the result is written to IndexedDB in the background. If the network
 * is down or the server errors (5xx, e.g. a dev proxy with no backend), the cached
 * copy is returned. 4xx errors are real answers, so they are rethrown as-is.
 */
export async function networkFirst<T>(
  fetcher: () => Promise<T>,
  save: (data: T) => Promise<void>,
  load: () => Promise<T | undefined>,
): Promise<T> {
  try {
    const data = await fetcher();
    save(data).catch((e) => console.warn('Could not persist chat history', e));
    return data;
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) throw err;
    const cached = await load().catch(() => undefined);
    if (cached !== undefined) return cached;
    throw err;
  }
}
