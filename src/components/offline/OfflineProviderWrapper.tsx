'use client';

import { OfflineProvider } from '@/lib/offline';
import { OfflineBanner, OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { ReactNode } from 'react';

export function OfflineProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <OfflineProvider>
      {children}
      <OfflineBanner />
      <OfflineIndicator />
    </OfflineProvider>
  );
}