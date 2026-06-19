import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

/**
 * The matcher tells Next.js which routes should run through this middleware.
 *
 * The pattern below matches everything EXCEPT:
 *  - Next.js internal files (_next, static assets)
 *  - Common static file extensions
 *
 * Always include API routes so authentication is enforced there too.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};