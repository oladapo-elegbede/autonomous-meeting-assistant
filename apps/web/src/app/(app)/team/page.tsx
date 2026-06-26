import { OrganizationProfile } from '@clerk/nextjs';

/**
 * Team management page.
 *
 * Wraps Clerk's pre-built OrganizationProfile component which
 * provides the full member management UI:
 *  - List current members
 *  - Invite new members by email
 *  - Change member roles (admin/member)
 *  - Remove members
 *  - Update organization settings
 *
 * All actions trigger Clerk webhooks that our API receives
 * and mirrors into PostgreSQL.
 */
export default function TeamPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your organization members, roles, and settings.
          </p>
        </header>

        <OrganizationProfile routing="hash" />
      </div>
    </main>
  );
}
