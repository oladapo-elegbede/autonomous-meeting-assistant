import { currentUser, auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { apiClient, ApiError } from '@/lib/api-client';

type WhoAmIData = {
  userId: string;
  sessionId: string | null;
};

/**
 * Temporary dashboard page.
 *
 * Demonstrates the full auth flow end-to-end:
 *   1. Server component runs on the server with Clerk's session
 *   2. We retrieve the user's JWT via auth().getToken()
 *   3. We call our protected API with the token
 *   4. The API verifies the token and returns the user info
 *   5. We display everything
 *
 * This is a placeholder. The real dashboard is built in Phase 4.
 */
export default async function DashboardPage() {
  const user = await currentUser();
  const { getToken } = await auth();
  const token = await getToken();

  let apiResult: WhoAmIData | null = null;
  let apiError: string | null = null;

  if (token) {
    try {
      apiResult = await apiClient.get<WhoAmIData>('/api/v1/me', token);
    } catch (error) {
      if (error instanceof ApiError) {
        apiError = `${error.code}: ${error.message}`;
      } else {
        apiError = 'Unknown error calling API';
      }
    }
  } else {
    apiError = 'No Clerk token available';
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <UserButton />
        </header>

        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-medium text-gray-900">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="text-gray-600">
            You are signed in as{' '}
            <span className="font-mono">{user?.emailAddresses[0]?.emailAddress}</span>
          </p>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-900">API Connection Test</h2>
          {apiResult ? (
            <div className="space-y-2">
              <p className="text-sm text-green-700">
                ✓ Successfully called <span className="font-mono">/api/v1/me</span> with your token.
              </p>
              <div className="rounded-md bg-gray-50 p-4 font-mono text-sm">
                <div>
                  <span className="text-gray-500">userId:</span> {apiResult.userId}
                </div>
                <div>
                  <span className="text-gray-500">sessionId:</span> {apiResult.sessionId ?? 'null'}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-700">✗ API call failed: {apiError}</p>
          )}
        </section>

        <p className="mt-6 text-sm text-gray-500">
          This is a temporary placeholder. The real dashboard is built in Phase 4.
        </p>
      </div>
    </main>
  );
}