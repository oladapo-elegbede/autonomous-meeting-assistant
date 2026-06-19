import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';

/**
 * Temporary dashboard page.
 *
 * Server component that fetches the current user via Clerk's server SDK
 * and displays a welcome message plus the user account menu.
 *
 * This is a placeholder. The real dashboard is built in Phase 4.
 */
export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-medium text-gray-900">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="text-gray-600">
            You are signed in as{' '}
            <span className="font-mono">{user?.emailAddresses[0]?.emailAddress}</span>
          </p>
          <p className="mt-4 text-sm text-gray-500">
            This is a temporary placeholder. The real dashboard is built in Phase 4.
          </p>
        </section>
      </div>
    </main>
  );
}
