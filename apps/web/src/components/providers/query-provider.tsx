'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * React Query provider.
 *
 * Wraps the entire app to give every component access to:
 *  - Cached API data
 *  - Loading and error states
 *  - Automatic background refetching
 *  - Optimistic updates
 *
 * Each browser tab gets its own QueryClient instance.
 * Cache is shared across all components in that tab.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures the QueryClient is created once per browser tab,
  // not once per render. Critical for avoiding cache resets.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Consider data fresh for 30 seconds before refetching
            staleTime: 30 * 1000,
            // Cache results for 5 minutes in memory after last use
            gcTime: 5 * 60 * 1000,
            // Do not retry on auth/permission errors (4xx)
            retry: (failureCount, error) => {
              if (error instanceof Error && 'status' in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 2;
            },
            // Do not refetch on window focus during development (annoying)
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
