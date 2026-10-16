import { queueMutation, getQueuedMutations, markMutationSynced, deleteMutation, incrementRetryCount, updateMutation } from './indexeddb';

export interface MutationOptions {
  entity: string;
  entityId?: string | number;
  type: 'create' | 'update' | 'delete';
  data: unknown;
  conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
  onSuccess?: (serverResponse: unknown) => void;
  onError?: (error: Error) => void;
  onConflict?: (serverData: unknown, clientData: unknown) => Promise<'server-wins' | 'client-wins' | 'merge'>;
  idempotencyKey?: string;
  dependsOnEntityType?: string;
  dependsOnEntityId?: number;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: Array<{
    entity: string;
    entityId: string | number;
    serverData: unknown;
    clientData: unknown;
  }>;
}

class OfflineMutationQueue {
  private syncInProgress = false;
  private maxRetries = 3;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: QueueStatus) => void> = new Set();

  getStatus(): QueueStatus {
    return {
      pending: 0,
      synced: 0,
      failed: 0,
      isSyncing: this.syncInProgress,
    };
  }

  async getDetailedStatus(): Promise<QueueStatus> {
    const mutations = await getQueuedMutations(false);
    const pending = mutations.filter(m => !m.synced).length;
    const synced = mutations.filter(m => m.synced).length;
    const failed = mutations.filter(m => m.retryCount >= this.maxRetries && !m.synced).length;
    return {
      pending,
      synced,
      failed,
      isSyncing: this.syncInProgress,
    };
  }

  subscribe(listener: (status: QueueStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.getDetailedStatus().then(status => {
      this.listeners.forEach(listener => listener(status));
    });
  }

  async enqueue(options: MutationOptions): Promise<number> {
    const id = await queueMutation({
      type: options.type,
      entity: options.entity,
      entityId: options.entityId,
      data: options.data,
      conflictResolution: options.conflictResolution || 'server-wins',
      idempotencyKey: options.idempotencyKey,
      dependsOnEntityType: options.dependsOnEntityType,
      dependsOnEntityId: options.dependsOnEntityId,
    });

    this.notifyListeners();

    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  async processQueue(): Promise<SyncResult> {
    if (this.syncInProgress || !navigator.onLine) {
      return { success: false, syncedCount: 0, failedCount: 0, conflicts: [] };
    }

    this.syncInProgress = true;
    this.notifyListeners();

    const mutations = await getQueuedMutations(true);
    let syncedCount = 0;
    let failedCount = 0;
    const conflicts: SyncResult['conflicts'] = [];

    for (const mutation of mutations) {
      if (mutation.retryCount >= this.maxRetries) {
        failedCount++;
        continue;
      }

      try {
        const result = await this.syncMutation(mutation);
        if (result.conflict) {
          conflicts.push(result.conflict);
          await this.handleConflict(mutation, result.conflict);
        } else {
          await markMutationSynced(mutation.id!);
          syncedCount++;
        }
      } catch (error) {
        await incrementRetryCount(mutation.id!);
        failedCount++;
        console.error('[OfflineQueue] Failed to sync mutation:', error);
      }
    }

    this.syncInProgress = false;
    this.notifyListeners();

    return { success: failedCount === 0, syncedCount, failedCount, conflicts };
  }

  private async syncMutation(mutation: Awaited<ReturnType<typeof getQueuedMutations>>[0]): Promise<{ conflict?: SyncResult['conflicts'][0] }> {
    const { type, entity, entityId, data, idempotencyKey, dependsOnEntityType, dependsOnEntityId } = mutation;
    const baseUrl = '/api';

let url = `${baseUrl}/`;
    let method = type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE';

    if (entityId && (type === 'update' || type === 'delete')) {
      url = `${baseUrl}//`;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (mutation.conflictResolution) {
      headers['X-Conflict-Resolution'] = mutation.conflictResolution;
    }

    // Add idempotency key header if present
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    // TODO: Add depends headers if needed? The API may expect them in body or headers.
    // For now, we rely on the SyncQueue storing them.

    const response = await fetch(url, {
      method,
      headers,
      body: type !== 'delete' ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (response.status === 409) {
      const serverData = await response.json();
      return { conflict: { entity, entityId: entityId || '', serverData, clientData: data } };
    }

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    const serverResponse = await response.json();
    return {};
  }

  private async handleConflict(
    mutation: Awaited<ReturnType<typeof getQueuedMutations>>[0],
    conflict: SyncResult['conflicts'][0]
  ): Promise<void> {
    const resolution = mutation.conflictResolution || 'server-wins';

    switch (resolution) {
      case 'server-wins':
        await markMutationSynced(mutation.id!);
        break;
      case 'client-wins':
        await this.forceClientUpdate(mutation, conflict);
        break;
      case 'merge':
        await this.mergeAndRetry(mutation, conflict);
        break;
    }
  }

  private async forceClientUpdate(mutation: Awaited<ReturnType<typeof getQueuedMutations>>[0], conflict: SyncResult['conflicts'][0]): Promise<void> {
    const { entity, entityId, data } = mutation;
    const baseUrl = '/api';
    const url = `${baseUrl}/${entity}/${entityId}?force=true`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Conflict-Resolution': 'client-wins',
        // Include idempotency key if present
        ...(mutation.idempotencyKey ? { 'Idempotency-Key': mutation.idempotencyKey } : {}),
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (response.ok) {
      await markMutationSynced(mutation.id!);
    } else {
      throw new Error('Force client update failed');
    }
  }

  private async mergeAndRetry(mutation: Awaited<ReturnType<typeof getQueuedMutations>>[0], conflict: SyncResult['conflicts'][0]): Promise<void> {
    const mergedData = this.mergeData(conflict.serverData, conflict.clientData);

    await updateMutation(mutation.id!, {
      data: mergedData,
      conflictResolution: 'client-wins',
      // Preserve idempotency key and depends fields
      idempotencyKey: mutation.idempotencyKey,
      dependsOnEntityType: mutation.dependsOnEntityType,
      dependsOnEntityId: mutation.dependsOnEntityId,
    });

    await this.processQueue();
  }

  private mergeData(serverData: unknown, clientData: unknown): unknown {
    if (typeof serverData !== 'object' || serverData === null ||
        typeof clientData !== 'object' || clientData === null) {
      return clientData;
    }

    const server = serverData as Record<string, unknown>;
    const client = clientData as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...server };

    for (const [key, value] of Object.entries(client)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      if (value !== undefined && value !== null) {
        merged[key] = value;
      }
    }

    return merged;
  }

  startPeriodicSync(intervalMs = 30000): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.processQueue();
      }
    }, intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async clearSynced(olderThanMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const { clearSyncedMutations } = await import('./indexeddb');
    await clearSyncedMutations(olderThanMs);
    this.notifyListeners();
  }

  async retryFailed(): Promise<void> {
    const mutations = await getQueuedMutations(true);
    for (const mutation of mutations) {
      if (mutation.retryCount >= this.maxRetries) {
        await updateMutation(mutation.id!, { retryCount: 0 });
      }
    }
    this.notifyListeners();
    if (navigator.onLine) {
      this.processQueue();
    }
  }
}

export interface QueueStatus {
  pending: number;
  synced: number;
  failed: number;
  isSyncing: boolean;
}

export const offlineMutationQueue = new OfflineMutationQueue();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineMutationQueue.processQueue();
  });

  window.addEventListener('offline', () => {
    console.log('[OfflineQueue] Going offline, mutations will be queued');
  });
}
