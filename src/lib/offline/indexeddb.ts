import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CachedDataValue {
  key: string;
  data: unknown;
  timestamp: number;
  etag?: string;
  version: number;
}

interface MutationQueueValue {
  id: number;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId?: string | number;
  data: unknown;
  timestamp: number;
  retryCount: number;
  synced: boolean;
  conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
  idempotencyKey?: string;
  dependsOnEntityType?: string;
  dependsOnEntityId?: number;
}

interface ConflictLogValue {
  id: number;
  entity: string;
  entityId: string | number;
  serverData: unknown;
  clientData: unknown;
  resolution: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  resolvedData?: unknown;
  timestamp: number;
  resolved: boolean;
}

interface OfflineStateValue {
  key: string;
  value: unknown;
}

// Use type assertion to avoid DBSchemaValue constraint issues
const offlineDBSchema = {} as unknown as DBSchema;

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('certai-offline', 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
        cacheStore.createIndex('by-timestamp', 'timestamp');

        const queueStore = db.createObjectStore('mutationQueue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('by-timestamp', 'timestamp');
        queueStore.createIndex('by-entity', 'entity');
        queueStore.createIndex('by-synced', 'synced');

        const conflictStore = db.createObjectStore('conflictLog', { keyPath: 'id', autoIncrement: true });
        conflictStore.createIndex('by-timestamp', 'timestamp');
        conflictStore.createIndex('by-entity', 'entity');
        conflictStore.createIndex('by-resolved', 'resolved');
      }
      if (oldVersion < 2) {
        db.createObjectStore('offlineState', { keyPath: 'key' });
      }
      if (oldVersion < 3) {
        const queueStore = db.transaction('mutationQueue', 'readwrite').objectStore('mutationQueue');
        queueStore.createIndex('by-idempotencyKey', 'idempotencyKey', { unique: true });
        queueStore.createIndex('by-depends', ['dependsOnEntityType', 'dependsOnEntityId']);
      }
    },
  });

  return dbInstance;
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export interface CachedData<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  etag?: string;
  version: number;
}

export async function cacheData<T>(key: string, data: T, etag?: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('cachedData', key);
  await db.put('cachedData', {
    key,
    data,
    timestamp: Date.now(),
    etag,
    version: (existing?.version || 0) + 1,
  });
}

export async function getCachedData<T>(key: string): Promise<CachedData<T> | undefined> {
  const db = await getDB();
  return db.get('cachedData', key) as Promise<CachedData<T> | undefined>;
}

export async function getAllCachedData(): Promise<CachedData[]> {
  const db = await getDB();
  return db.getAll('cachedData');
}

export async function deleteCachedData(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('cachedData', key);
}

export async function clearCache(): Promise<void> {
  const db = await getDB();
  await db.clear('cachedData');
}

export interface QueuedMutation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId?: string | number;
  data: unknown;
  timestamp: number;
  retryCount: number;
  synced: boolean;
  conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
  idempotencyKey?: string;
  dependsOnEntityType?: string;
  dependsOnEntityId?: number;
}

export async function queueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'synced'>): Promise<number> {
  const db = await getDB();
  // Generate idempotencyKey if not provided
  const idempotencyKey = mutation.idempotencyKey ?? crypto.randomUUID();
  const id = await db.add('mutationQueue', {
    ...mutation,
    idempotencyKey,
    timestamp: Date.now(),
    retryCount: 0,
    synced: false,
  });
  return id as number;
}

export async function getQueuedMutations(onlyUnsynced = true): Promise<QueuedMutation[]> {
  const db = await getDB();
  if (onlyUnsynced) {
    return db.getAllFromIndex('mutationQueue', 'by-synced', IDBKeyRange.only(false));
  }
  return db.getAll('mutationQueue');
}

export async function updateMutation(id: number, updates: Partial<QueuedMutation>): Promise<void> {
  const db = await getDB();
  const mutation = await db.get('mutationQueue', id);
  if (mutation) {
    await db.put('mutationQueue', { ...mutation, ...updates });
  }
}

export async function markMutationSynced(id: number): Promise<void> {
  await updateMutation(id, { synced: true });
}

export async function incrementRetryCount(id: number): Promise<void> {
  const db = await getDB();
  const mutation = await db.get('mutationQueue', id);
  if (mutation) {
    await db.put('mutationQueue', { ...mutation, retryCount: mutation.retryCount + 1 });
  }
}

export async function deleteMutation(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('mutationQueue', id);
}

export async function clearSyncedMutations(olderThanMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const db = await getDB();
  const mutations = await db.getAllFromIndex('mutationQueue', 'by-synced', IDBKeyRange.only(true));
  const cutoff = Date.now() - olderThanMs;
  for (const mutation of mutations) {
    if (mutation.timestamp < cutoff) {
      await db.delete('mutationQueue', mutation.id!);
    }
  }
}

export interface ConflictEntry {
  id?: number;
  entity: string;
  entityId: string | number;
  serverData: unknown;
  clientData: unknown;
  resolution: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  resolvedData?: unknown;
  timestamp: number;
  resolved: boolean;
}

export async function logConflict(conflict: Omit<ConflictEntry, 'id' | 'timestamp' | 'resolved'>): Promise<number> {
  const db = await getDB();
  const id = await db.add('conflictLog', {
    ...conflict,
    timestamp: Date.now(),
    resolved: false,
  });
  return id as number;
}

export async function getConflicts(resolved?: boolean): Promise<ConflictEntry[]> {
  const db = await getDB();
  if (resolved !== undefined) {
    return db.getAllFromIndex('conflictLog', 'by-resolved', IDBKeyRange.only(resolved));
  }
  return db.getAll('conflictLog');
}

export async function resolveConflict(id: number, resolution: ConflictEntry['resolution'], resolvedData?: unknown): Promise<void> {
  const db = await getDB();
  const conflict = await db.get('conflictLog', id);
  if (conflict) {
    await db.put('conflictLog', {
      ...conflict,
      resolution,
      resolvedData,
      resolved: true,
    });
  }
}

export async function setOfflineState(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('offlineState', { key, value });
}

export async function getOfflineState<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const result = await db.get('offlineState', key);
  return result?.value as T | undefined;
}

export async function removeOfflineState(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('offlineState', key);
}

export const STORE_NAMES = {
  CACHED_DATA: 'cachedData',
  MUTATION_QUEUE: 'mutationQueue',
  CONFLICT_LOG: 'conflictLog',
  OFFLINE_STATE: 'offlineState',
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];
