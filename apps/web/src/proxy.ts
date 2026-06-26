import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Public routes that do NOT require authentication.
 *
 * Everything not listed here will require the user to be signed in.
 * This is "secure by default" — we explicitly allow what is public,
 * not the other way around.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
]);

/**
 * Routes that authenticated users can access even without
 * belonging to an organization. The onboarding flow itself
 * must be reachable so users can create their first org.
 */
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // 1. Allow public routes through without any checks
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // 2. Require authentication for everything else
  const { userId, orgId } = await auth();

  if (!userId) {
    await auth.protect();
    return NextResponse.next();
  }

  // 3. Authenticated but no organization → send to onboarding
  //    (unless they are already on the onboarding flow)
  if (!orgId && !isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // 4. Authenticated user trying to revisit onboarding when they
  //    already have an org → send them to the dashboard instead
  if (orgId && isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
