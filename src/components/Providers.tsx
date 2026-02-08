'use client';

import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VaultProvider } from '@/contexts/VaultContext';
import ErrorBoundary from './ErrorBoundary';
import dynamic from 'next/dynamic';
import { darkTheme } from '@rainbow-me/rainbowkit';

// Lazy load RainbowKit components to reduce initial bundle size
const WagmiProvider = dynamic(() => import('wagmi').then(mod => mod.WagmiProvider), {
  ssr: false,
  loading: () => null,
});

const RainbowKitProvider = dynamic(
  () => import('@rainbow-me/rainbowkit').then(mod => mod.RainbowKitProvider),
  {
    ssr: false,
    loading: () => null,
  }
);

import { config } from '@/lib/wagmi';

// Create query client with optimized settings
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return createQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = createQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  const wagmiConfig = useMemo(() => config, []);

  return (
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#16a34a', // Darker green for better contrast
              accentColorForeground: '#ffffff',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small',
            })}
          >
            <VaultProvider>
              {children}
            </VaultProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
