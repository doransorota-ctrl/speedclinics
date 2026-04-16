import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = [
  "/",
  "/aanmelden",
  "/demo",
  "/bedankt",
  "/login",
  "/privacy",
  "/voorwaarden",
  "/contact",
  "/setup",
];

const AUTH_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Defense-in-depth: require auth for all portal API routes
  if (pathname.startsWith("/api/portal/")) {
    try {
      const { user, supabaseResponse } = await updateSession(request);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return supabaseResponse;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Skip API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if the route is public
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPortalRoute = pathname.startsWith("/portal");

  // Only check auth for portal routes
  if (!isPortalRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Refresh session and get user
  try {
    const { user, supabaseResponse } = await updateSession(request);

    // Authenticated user visiting /login → redirect to portal
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }

    // Unauthenticated user visiting /portal → redirect to login
    if (isPortalRoute && !user) {
      const loginUrl = new URL("/login", request.url);
      const safePath = pathname.startsWith("/portal/") ? pathname : "/portal/dashboard";
      loginUrl.searchParams.set("redirect", safePath);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user visiting /portal → check they completed signup
    if (isPortalRoute && user && !pathname.startsWith("/portal/onboarding")) {
      const supabaseCheck = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll() { /* read-only for this check */ },
          },
        }
      );
      const { data: business } = await supabaseCheck
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!business) {
        return NextResponse.redirect(new URL("/aanmelden/profiel", request.url));
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware auth error:", error);
    // Auth check failed — redirect to login for portal routes (fail safe)
    if (isPortalRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
