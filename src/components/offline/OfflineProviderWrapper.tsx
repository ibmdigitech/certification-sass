'use client';

import { OfflineProvider } from '@/lib/offline';
import { ReactNode } from 'react';

export function OfflineProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <OfflineProvider>
      {children}
    </OfflineProvider>
  );
}