import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/v1/(.*)",
  "/api/test/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;
  
  // For API routes: serve on both www and non-www (no redirect)
  // This preserves Authorization headers which are dropped on redirects
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  
  // For non-API routes: redirect non-www to www for consistency
  if (host === "dogecat.com") {
    const url = req.nextUrl.clone();
    url.host = "www.dogecat.com";
    return NextResponse.redirect(url, 308);
  }

  if (req.nextUrl.pathname.startsWith("/api/test/")) {
    return NextResponse.next();
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (isDashboardRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
