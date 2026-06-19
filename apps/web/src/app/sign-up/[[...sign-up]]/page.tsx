import { SignUp } from '@clerk/nextjs';

/**
 * Sign-up page.
 *
 * Renders Clerk's pre-built SignUp component.
 * The catch-all dynamic segment [[...sign-up]] handles all of Clerk's
 * internal routing (email verification, OAuth callback, etc.).
 */
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SignUp />
    </main>
  );
}