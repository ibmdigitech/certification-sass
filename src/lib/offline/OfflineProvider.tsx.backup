'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { offlineMutationQueue, QueueStatus } from '@/lib/offline/mutation-queue';
import { conflictResolver, ConflictStrategy, ResolvedConflict } from '@/lib/offline/conflict-resolution';
import { cacheData, getCachedData, getAllCachedData, clearCache } from '@/lib/offline/indexeddb';

interface OfflineContextType {
  isOnline: boolean;
  wasOffline: boolean;
  queueStatus: QueueStatus;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
  registerServiceWorker: () => Promise<void>;
  updateServiceWorker: () => Promise<void>;
  enqueueMutation: (options: {
    entity: string;
    entityId?: string | number;
    type: 'create' | 'update' | 'delete';
    data: unknown;
    conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
  }) => Promise<number>;
  processQueue: () => Promise<{ success: boolean; syncedCount: number; failedCount: number }>;
  retryFailed: () => Promise<void>;
  clearSyncedMutations: (olderThanMs?: number) => Promise<void>;
  cacheData: (key: string, data: unknown, etag?: string) => Promise<void>;
  getCachedData: (key: string) => Promise<{ key: string; data: unknown; timestamp: number; etag?: string; version: number } | undefined>;
  getAllCachedData: () => Promise<Array<{ key: string; data: unknown; timestamp: number; etag?: string; version: number }>>;
  clearAllCache: () => Promise<void>;
  resolveConflict: (
    entity: string,
    entityId: string | number,
    serverData: unknown,
    clientData: unknown,
    strategy?: 'server-wins' | 'client-wins' | 'merge' | 'timestamp' | 'custom'
  ) => Promise<ResolvedConflict>;
  getPendingConflicts: (entity?: string) => Promise<Array<{
    id?: number;
    entity: string;
    entityId: string | number;
    serverData: unknown;
    clientData: unknown;
    resolution: ConflictStrategy;
    resolvedData?: unknown;
    timestamp: number;
    resolved: boolean;
  }>>;
  setEntityConflictStrategy: (entity: string, strategy: 'server-wins' | 'client-wins' | 'merge' | 'timestamp' | 'custom') => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function useOfflineContext() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

function OfflineProviderInternal({ children }: { children: ReactNode }): React.ReactElement {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    synced: 0,
    failed: 0,
    isSyncing: false,
  });
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const [lastOfflineAt, setLastOfflineAt] = useState<number | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [needRefresh, setNeedRefresh] = useState(false);

  const updateQueueStatus = useCallback(async () => {
    const status = await offlineMutationQueue.getDetailedStatus();
    setQueueStatus(status);
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setWasOffline(true);
      setLastOnlineAt(Date.now());
      await offlineMutationQueue.processQueue();
      updateQueueStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setLastOfflineAt(Date.now());
    };

    const unsubscribe = offlineMutationQueue.subscribe(setQueueStatus);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updateQueueStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [updateQueueStatus]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        setSwRegistration(registration);
      });
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setSwRegistration(registration);
        console.log('[OfflineProvider] Service Worker registered');
      } catch (error) {
        console.error('[OfflineProvider] Service Worker registration failed:', error);
      }
    }
  }, []);

  const updateServiceWorker = useCallback(async () => {
    if (swRegistration) {
      await swRegistration.update();
      setNeedRefresh(true);
    }
  }, [swRegistration]);

  useEffect(() => {
    if (needRefresh && swRegistration) {
      if (swRegistration.waiting) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }, [needRefresh, swRegistration]);

  const enqueueMutation = useCallback(async (options: {
    entity: string;
    entityId?: string | number;
    type: 'create' | 'update' | 'delete';
    data: unknown;
    conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
  }) => {
    const id = await offlineMutationQueue.enqueue(options);
    updateQueueStatus();
    return id;
  }, [updateQueueStatus]);

  const processQueue = useCallback(async () => {
    const result = await offlineMutationQueue.processQueue();
    updateQueueStatus();
    return { success: result.success, syncedCount: result.syncedCount, failedCount: result.failedCount };
  }, [updateQueueStatus]);

  const retryFailed = useCallback(async () => {
    await offlineMutationQueue.retryFailed();
    updateQueueStatus();
  }, [updateQueueStatus]);

  const clearSyncedMutations = useCallback(async (olderThanMs = 7 * 24 * 60 * 60 * 1000) => {
    await offlineMutationQueue.clearSynced(olderThanMs);
    updateQueueStatus();
  }, [updateQueueStatus]);

  const cacheDataWrapper = useCallback((key: string, data: unknown, etag?: string) => {
    return cacheData(key, data, etag);
  }, []);

  const getCachedDataWrapper = useCallback((key: string) => {
    return getCachedData(key) as Promise<{ key: string; data: unknown; timestamp: number; etag?: string; version: number } | undefined>;
  }, []);

  const getAllCachedDataWrapper = useCallback(() => {
    return getAllCachedData();
  }, []);

  const clearAllCacheWrapper = useCallback(() => {
    return clearCache();
  }, []);

  const resolveConflict = useCallback(async (
    entity: string,
    entityId: string | number,
    serverData: unknown,
    clientData: unknown,
    strategy?: 'server-wins' | 'client-wins' | 'merge' | 'timestamp' | 'custom'
  ) => {
    return conflictResolver.resolveConflict(entity, entityId, serverData, clientData, { strategy: strategy as 'server-wins' | 'client-wins' | 'merge' | 'timestamp' | 'custom' });
  }, []);

  const getPendingConflicts = useCallback(async (entity?: string) => {
    return conflictResolver.getPendingConflicts(entity);
  }, []);

  const setEntityConflictStrategy = useCallback((entity: string, strategy: 'server-wins' | 'client-wins' | 'merge' | 'timestamp' | 'custom') => {
    conflictResolver.setEntityStrategy(entity, strategy);
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        wasOffline,
        queueStatus,
        lastOnlineAt,
        lastOfflineAt,
        registerServiceWorker,
        updateServiceWorker,
        enqueueMutation,
        processQueue,
        retryFailed,
        clearSyncedMutations,
        cacheData: cacheDataWrapper,
        getCachedData: getCachedDataWrapper,
        getAllCachedData: getAllCachedDataWrapper,
        clearAllCache: clearAllCacheWrapper,
        resolveConflict,
        getPendingConflicts,
        setEntityConflictStrategy,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

// Export the provider directly as a named export
export const OfflineProvider = OfflineProviderInternal;
export { useOfflineContext as useOffline };