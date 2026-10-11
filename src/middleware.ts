import { withAuth } from 'next-auth/middleware';

// Protect every page under the app. Unauthenticated users are redirected to
// /login instead of landing on a page whose API calls fail with 401.
export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Next.js matches this against the pathname from the start. Excluded:
     * - /login (sign-in page) and /verify (public certificate checks)
     * - /api/auth/* (NextAuth endpoints, incl. the credentials callback)
     * - /api/verify/* (public verification API)
     * - static assets and the service worker
     * - any path containing a file extension
     *
     * Note: no capturing groups are permitted here.
     */
    '/((?!login|verify|api/auth|api/verify|_next|sw\\.js|manifest\\.json|offline\\.html|icons|.*\\..*).*)',
  ],
};
