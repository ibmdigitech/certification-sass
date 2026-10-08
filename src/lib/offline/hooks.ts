'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOffline } from '@/lib/offline';
import { offlineMutationQueue, QueueStatus } from '@/lib/offline/mutation-queue';
import { conflictResolver, ResolvedConflict } from '@/lib/offline/conflict-resolution';

export interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  queueStatus: QueueStatus;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
}

export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    queueStatus: { pending: 0, synced: 0, failed: 0, isSyncing: false },
    lastOnlineAt: null,
    lastOfflineAt: null,
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        wasOffline: true,
        lastOnlineAt: Date.now(),
      }));
      offlineMutationQueue.processQueue();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        wasOffline: true,
        lastOfflineAt: Date.now(),
      }));
    };

    const unsubscribe = offlineMutationQueue.subscribe(queueStatus => {
      setStatus(prev => ({ ...prev, queueStatus }));
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    offlineMutationQueue.getDetailedStatus().then(queueStatus => {
      setStatus(prev => ({ ...prev, queueStatus }));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return status;
}

export function useOfflineQueue() {
  const enqueue = useCallback(async (options: Parameters<typeof offlineMutationQueue.enqueue>[0]) => {
    return offlineMutationQueue.enqueue(options);
  }, []);

  const processQueue = useCallback(async () => {
    return offlineMutationQueue.processQueue();
  }, []);

  const getStatus = useCallback(async () => {
    return offlineMutationQueue.getDetailedStatus();
  }, []);

  const retryFailed = useCallback(async () => {
    return offlineMutationQueue.retryFailed();
  }, []);

  const clearSynced = useCallback(async (olderThanMs?: number) => {
    return offlineMutationQueue.clearSynced(olderThanMs);
  }, []);

  return { enqueue, processQueue, getStatus, retryFailed, clearSynced };
}

export function usePeriodicSync(intervalMs = 30000) {
  useEffect(() => {
    offlineMutationQueue.startPeriodicSync(intervalMs);
    return () => offlineMutationQueue.stopPeriodicSync();
  }, [intervalMs]);
}

export function useNetworkQuality() {
  const [quality, setQuality] = useState<'unknown' | 'good' | 'poor' | 'offline'>('unknown');

  useEffect(() => {
    const connection = (navigator as Navigator & { 
      connection?: { 
        effectiveType: string; 
        rtt: number; 
        downlink: number; 
        addEventListener: (event: string, listener: () => void) => void; 
        removeEventListener: (event: string, listener: () => void) => void 
      } 
    }).connection;

    const updateQuality = () => {
      if (!navigator.onLine) {
        setQuality('offline');
        return;
      }

      if (connection) {
        if (connection.effectiveType === '4g' && connection.rtt < 100 && connection.downlink > 1.5) {
          setQuality('good');
        } else {
          setQuality('poor');
        }
      } else {
        setQuality('unknown');
      }
    };

    updateQuality();
    connection?.addEventListener('change', updateQuality);

    return () => connection?.removeEventListener('change', updateQuality);
  }, []);

  return quality;
}

export interface OfflineApiOptions {
  entity?: string;
  entityId?: string | number;
  conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
}

export function useOfflineApi() {
  const { enqueueMutation, processQueue, cacheData, getCachedData, resolveConflict, getPendingConflicts } = useOffline();

  const executeMutation = useCallback(async <T>(
    type: 'create' | 'update' | 'delete',
    entity: string,
    data: unknown,
    options?: OfflineApiOptions
  ): Promise<{ success: boolean; data?: T; queued: boolean; error?: Error }> => {
    try {
      const response = await fetch(`/api/${entity}${options?.entityId ? `/${options.entityId}` : ''}`, {
        method: type === 'create' ? 'POST' : type === 'delete' ? 'DELETE' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.conflictResolution && { 'X-Conflict-Resolution': options.conflictResolution }),
        },
        body: type !== 'delete' ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result, queued: false };
      }

      if (response.status === 409) {
        const serverData = await response.json();
        const resolution = await resolveConflict(entity, options?.entityId || '', serverData, data, options?.conflictResolution);

        if (resolution.requiresManualReview) {
          return { success: false, error: new Error('Conflict requires manual resolution'), queued: false };
        }

        if (resolution.resolution === 'client-wins') {
          const forceResponse = await fetch(`/api/${entity}/${options?.entityId}?force=true`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Conflict-Resolution': 'client-wins',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          });
          if (forceResponse.ok) {
            const result = await forceResponse.json();
            return { success: true, data: result, queued: false };
          }
        }
      }

      throw new Error(`Request failed: ${response.status}`);
    } catch (error) {
      if (navigator.onLine) {
        return { success: false, error: error as Error, queued: false };
      }

      const mutationId = await enqueueMutation({
        entity,
        entityId: options?.entityId,
        type,
        data,
        conflictResolution: options?.conflictResolution,
      });

      return { success: true, queued: true, data: { mutationId } as unknown as T };
    }
  }, [enqueueMutation, resolveConflict]);

  const create = useCallback(<T>(entity: string, data: unknown, options?: OfflineApiOptions) =>
    executeMutation('create', entity, data, options), [executeMutation]);

  const update = useCallback(<T>(entity: string, entityId: string | number, data: unknown, options?: OfflineApiOptions) =>
    executeMutation('update', entity, data, { ...options, entityId }), [executeMutation]);

  const remove = useCallback(<T>(entity: string, entityId: string | number, options?: OfflineApiOptions) =>
    executeMutation('delete', entity, {}, { ...options, entityId }), [executeMutation]);

  const get = useCallback(async (key: string, fetcher: () => Promise<unknown>, maxAge = 5 * 60 * 1000): Promise<unknown> => {
    const cached = await getCachedData(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      await cacheData(key, data);
      return data;
    } catch {
      if (cached) return cached.data;
      throw new Error('Failed to fetch and no cached data available');
    }
  }, [getCachedData, cacheData]);

  const handleConflict = useCallback(async (
    entity: string,
    entityId: string | number,
    serverData: unknown,
    clientData: unknown,
    strategy?: 'server-wins' | 'client-wins' | 'merge' | 'timestamp' | 'custom'
  ): Promise<ResolvedConflict> => {
    return resolveConflict(entity, entityId, serverData, clientData, strategy);
  }, [resolveConflict]);

  const fetchPendingConflicts = useCallback(async (entity?: string) => {
    return getPendingConflicts(entity);
  }, [getPendingConflicts]);

  return {
    create,
    update,
    remove,
    get,
    handleConflict,
    fetchPendingConflicts,
    processQueue,
  };
}

export function useOfflineMutation(entity: string) {
  const { create, update, remove } = useOfflineApi();

  return {
    create: (data: unknown, options?: OfflineApiOptions) => create(entity, data, options),
    update: (entityId: string | number, data: unknown, options?: OfflineApiOptions) => update(entity, entityId, data, options),
    remove: (entityId: string | number, options?: OfflineApiOptions) => remove(entity, entityId, options),
  };
}