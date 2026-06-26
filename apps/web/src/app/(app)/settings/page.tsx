'use client';

import { UserProfile, OrganizationProfile } from '@clerk/nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building2 } from 'lucide-react';

/**
 * Settings page.
 *
 * Tabbed interface for managing the user's personal profile
 * and the active organization's settings.
 *
 * We use Clerk's pre-built profile components which handle:
 *   - Email management
 *   - Password changes
 *   - Connected accounts (OAuth providers)
 *   - Avatar uploads
 *   - Multi-factor auth
 *   - Organization branding, members, roles
 *
 * Customizing the appearance.elements lets the components
 * blend visually with our app shell.
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal profile and organization preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <UserProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full shadow-none border border-border',
              },
            }}
          />
        </TabsContent>

        <TabsContent value="organization">
          <OrganizationProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full shadow-none border border-border',
              },
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
