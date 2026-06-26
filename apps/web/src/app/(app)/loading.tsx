import { Skeleton } from '@/components/ui/skeleton';

/**
 * Global loading state for the (app) route group.
 *
 * Next.js automatically shows this while server components
 * are fetching data. It appears in place of {children}
 * inside layout.tsx — so the sidebar and header stay visible
 * while only the content area shimmers.
 *
 * Per-page loading.tsx files can override this for more
 * specific skeletons that match a page's actual layout.
 */
export default function AppLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>

      <Skeleton className="h-64 w-full" />
    </div>
  );
}
