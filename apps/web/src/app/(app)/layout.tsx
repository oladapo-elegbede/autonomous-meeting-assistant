import { Sidebar } from '@/components/layout/sidebar';
import { AppHeader } from '@/components/layout/app-header';

/**
 * Shared layout for all authenticated app pages.
 *
 * Wraps every page in the (app) route group with:
 *   - A persistent sidebar on the left
 *   - A persistent header on top
 *   - A scrollable content area in the middle
 *
 * Pages like sign-in, sign-up, and onboarding live outside
 * this group and do not get the sidebar/header.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
