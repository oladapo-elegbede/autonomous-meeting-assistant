import Link from 'next/link';
import { currentUser, auth } from '@clerk/nextjs/server';
import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';
import { apiClient, ApiError } from '@/lib/api-client';

type WhoAmIData = {
  userId: string;
  sessionId: string | null;
  orgId: string | null | undefined;
  orgRole: string | null | undefined;
};

type WorkspaceContextData = {
  userId: string;
  orgId: string;
  orgRole: string;
};

type AdminCheckData = {
  message: string;
  role: string;
};

type EndpointResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; code: string; message: string };

async function callEndpoint<T>(path: string, token: string): Promise<EndpointResult<T>> {
  try {
    const data = await apiClient.get<T>(path, token);
    return { status: 'success', data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: 'error', code: error.code, message: error.message };
    }
    return { status: 'error', code: 'UNKNOWN', message: 'Unknown error' };
  }
}

/**
 * Temporary dashboard page.
 *
 * Calls three protected endpoints to demonstrate the layered
 * authorization model:
 *   1. /api/v1/me — requires authentication only
 *   2. /api/v1/workspace/context — requires active organization
 *   3. /api/v1/admin/check — requires admin role
 *
 * Replaced by the real dashboard in Phase 4.
 */
export default async function DashboardPage() {
  const user = await currentUser();
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <p className="text-center text-red-700">No Clerk token available.</p>
      </main>
    );
  }

  const [meResult, workspaceResult, adminResult] = await Promise.all([
    callEndpoint<WhoAmIData>('/api/v1/me', token),
    callEndpoint<WorkspaceContextData>('/api/v1/workspace/context', token),
    callEndpoint<AdminCheckData>('/api/v1/admin/check', token),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-gray-900">Meeting Assistant</h1>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="font-medium text-gray-900 hover:text-gray-700">
                Dashboard
              </Link>
              <Link href="/team" className="font-medium text-gray-600 hover:text-gray-900">
                Team
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterLeaveOrganizationUrl="/onboarding"
              afterSelectOrganizationUrl="/dashboard"
            />
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-medium text-gray-900">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="text-gray-600">
            You are signed in as{' '}
            <span className="font-mono">{user?.emailAddresses[0]?.emailAddress}</span>
          </p>
        </section>

        <EndpointCard
          title="1. requireAuth"
          path="/api/v1/me"
          description="Returns the current user's session. Only requires sign-in."
          result={meResult}
        />

        <EndpointCard
          title="2. requireOrg"
          path="/api/v1/workspace/context"
          description="Returns the active organization. Requires an active org."
          result={workspaceResult}
        />

        <EndpointCard
          title="3. requireRole('admin')"
          path="/api/v1/admin/check"
          description="Admin-only endpoint. Requires admin or owner role."
          result={adminResult}
        />

        <p className="text-sm text-gray-500">
          This is a temporary placeholder. The real dashboard is built in Phase 4.
        </p>
      </div>
    </main>
  );
}

function EndpointCard<T>({
  title,
  path,
  description,
  result,
}: {
  title: string;
  path: string;
  description: string;
  result: EndpointResult<T>;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-mono">{path}</span> — {description}
        </p>
      </div>

      {result.status === 'success' ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-700">✓ Success</p>
          <pre className="overflow-auto rounded-md bg-gray-50 p-4 font-mono text-xs">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-700">✗ {result.code}</p>
          <pre className="overflow-auto rounded-md bg-red-50 p-4 font-mono text-xs text-red-900">
            {result.message}
          </pre>
        </div>
      )}
    </section>
  );
}
