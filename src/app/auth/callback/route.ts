import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ALLOWED_PREFIXES = ["/portal", "/aanmelden/profiel"];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") ?? "/portal/dashboard";
  // Prevent open redirect — only allow safe paths
  const next = ALLOWED_PREFIXES.some((p) => rawNext.startsWith(p))
    ? rawNext
    : "/portal/dashboard";

  // Use APP_URL as single source of truth — never trust forwarded headers
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      // Check if user has a business record — if not, redirect to profile completion
      const serviceClient = createServiceRoleClient();
      const { data: business } = await serviceClient
        .from("businesses")
        .select("id")
        .eq("owner_id", sessionData.user.id)
        .maybeSingle();

      if (!business) {
        return NextResponse.redirect(`${origin}/aanmelden/profiel`);
      }

      // Existing user coming from signup page — send to dashboard instead
      if (next === "/aanmelden/profiel") {
        return NextResponse.redirect(`${origin}/portal/dashboard`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    if (error) {
      console.error("[Auth Callback] Code exchange failed:", error.message);
    } else {
      console.error("[Auth Callback] No error but no user in session data");
    }
  } else {
    console.error("[Auth Callback] No code parameter in URL:", requestUrl.search);
  }

  // Fallback: redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
