'use client';

import { useState, useEffect } from 'react';
import { useOfflineStatus, useOfflineQueue } from '@/lib/offline/hooks';
import { WifiOff, Wifi, AlertCircle, RotateCcw, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator({ className, showQueueStatus = true }: { className?: string; showQueueStatus?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { isOnline, wasOffline, queueStatus, lastOnlineAt, lastOfflineAt } = useOfflineStatus();
  const { processQueue, retryFailed } = useOfflineQueue();

  // Gate on mount so SSR output (no navigator) matches the initial client render
  // before navigator.onLine is read. This prevents hydration mismatches.
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 flex items-center gap-2', className)}>
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 shadow-lg animate-slide-in">
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">You're offline</span>
          </div>
          {showQueueStatus && queueStatus.pending > 0 && (
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-destructive/10">
              {queueStatus.pending} pending
            </span>
          )}
        </div>
      )}

      {isOnline && wasOffline && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 shadow-lg animate-slide-in">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-500">Back online</span>
          </div>
          {queueStatus.pending > 0 && (
            <>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-emerald-500/10">
                Syncing {queueStatus.pending}...
              </span>
              <button
                onClick={processQueue}
                disabled={queueStatus.isSyncing}
                className="text-xs text-emerald-500 hover:text-emerald-600 font-medium"
              >
                Sync now
              </button>
            </>
          )}
          {queueStatus.failed > 0 && (
            <button
              onClick={retryFailed}
              className="text-xs text-amber-500 hover:text-amber-600 font-medium"
            >
              Retry {queueStatus.failed} failed
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function OfflineBanner({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { isOnline, wasOffline, queueStatus } = useOfflineStatus();
  const { processQueue, retryFailed } = useOfflineQueue();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;
  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 border-b animate-slide-down',
        isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Working offline</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">Connection restored</span>
            </>
          )}
          {queueStatus.pending > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {queueStatus.pending} change{queueStatus.pending !== 1 ? 's' : ''} pending sync
            </span>
          )}
        </div>

        {!isOnline && queueStatus.pending > 0 && (
          <button
            onClick={processQueue}
            disabled={queueStatus.isSyncing}
            className="text-xs text-primary hover:text-primary/80 font-medium underline"
          >
            {queueStatus.isSyncing ? 'Syncing...' : 'Sync now'}
          </button>
        )}

        {isOnline && queueStatus.failed > 0 && (
          <button
            onClick={retryFailed}
            className="text-xs text-amber-500 hover:text-amber-600 font-medium underline"
          >
            Retry {queueStatus.failed} failed
          </button>
        )}
      </div>
    </div>
  );
}

export function QueueStatusPanel({ className }: { className?: string }) {
  const { queueStatus } = useOfflineStatus();
  const { processQueue, retryFailed: retry, clearSynced } = useOfflineQueue();

  if (queueStatus.pending === 0 && queueStatus.synced === 0 && queueStatus.failed === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <h3 className="font-medium mb-3">Offline Queue Status</h3>
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div className="rounded-lg bg-muted p-3">
          <div className="text-2xl font-bold text-destructive">{queueStatus.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <div className="text-2xl font-bold text-emerald-500">{queueStatus.synced}</div>
          <div className="text-xs text-muted-foreground">Synced</div>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <div className="text-2xl font-bold text-amber-500">{queueStatus.failed}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
      </div>

      <div className="flex gap-2">
        {queueStatus.pending > 0 && (
          <button
            onClick={processQueue}
            disabled={queueStatus.isSyncing}
            className="flex-1 btn btn-sm btn-outline"
          >
            {queueStatus.isSyncing ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </button>
        )}
        {queueStatus.failed > 0 && (
          <button
            onClick={retry}
            className="flex-1 btn btn-sm btn-outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry Failed
          </button>
        )}
        {queueStatus.synced > 0 && (
          <button
            onClick={() => clearSynced()}
            className="flex-1 btn btn-sm btn-outline"
          >
            <CloudOff className="h-4 w-4 mr-2" />
            Clear History
          </button>
        )}
      </div>
    </div>
  );
}

export function NetworkQualityIndicator({ className }: { className?: string }) {
  const quality = useNetworkQuality();

  if (quality === 'unknown') return null;

  const configs = {
    good: { icon: Wifi, color: 'text-emerald-500', label: 'Good connection' },
    poor: { icon: Wifi, color: 'text-amber-500', label: 'Slow connection' },
    offline: { icon: WifiOff, color: 'text-destructive', label: 'Offline' },
  } as const;

  const config = configs[quality as keyof typeof configs];

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <config.icon className={cn('h-3.5 w-3.5', config.color)} />
      <span className={cn(config.color)}>{config.label}</span>
    </div>
  );
}

function useNetworkQuality() {
  const [quality, setQuality] = useState<'unknown' | 'good' | 'poor' | 'offline'>('unknown');

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { effectiveType: string; rtt: number; downlink: number; addEventListener: (event: string, listener: () => void) => void; removeEventListener: (event: string, listener: () => void) => void } }).connection;

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