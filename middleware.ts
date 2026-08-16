import { withAuth } from "next-auth/middleware";

// This only gates page navigation for UX (bounce signed-out visitors to
// /login). It is NOT the security boundary — every API route independently
// re-checks the session and role via lib/permissions.ts, since a middleware
// redirect can never be trusted to stop a direct API request.
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
