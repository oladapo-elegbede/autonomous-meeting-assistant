import { CreateOrganization } from '@clerk/nextjs';

/**
 * Onboarding page.
 *
 * Shown to authenticated users who do not yet belong to an organization.
 * Clerk's CreateOrganization component handles the entire creation flow:
 *  - Name input
 *  - Slug generation
 *  - Logo upload
 *  - API call to Clerk
 *
 * On success, Clerk fires organization.created and
 * organizationMembership.created webhooks, which our API receives
 * and mirrors to the database.
 */
export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your workspace to start uploading meetings and collaborating with your team.
          </p>
        </div>

        <CreateOrganization afterCreateOrganizationUrl="/dashboard" skipInvitationScreen={false} />
      </div>
    </main>
  );
}
