'use client';

import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';

/**
 * App header.
 *
 * Persistent top bar that appears on every authenticated app page.
 * Contains:
 *  - Organization switcher (left)  — pick which org you are working in
 *  - User avatar dropdown (right) — account menu and sign-out
 */
export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/dashboard"
          afterLeaveOrganizationUrl="/onboarding"
          afterSelectOrganizationUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'flex items-center',
              organizationSwitcherTrigger: 'rounded-md px-2 py-1 hover:bg-accent',
            },
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  );
}
