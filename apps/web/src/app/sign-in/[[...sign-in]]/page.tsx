import { SignIn } from '@clerk/nextjs';

/**
 * Sign-in page.
 *
 * Renders Clerk's pre-built SignIn component with our app's styling.
 * The catch-all dynamic segment [[...sign-in]] handles all of Clerk's
 * internal routing (email verification, password reset, multi-factor, etc.).
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SignIn />
    </main>
  );
}