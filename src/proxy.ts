import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

// ログインせずに開ける道。
const PUBLIC_PATHS = ["/login", "/auth/callback"];

/**
 * すべての画面の前で、セッションを更新し、本人以外を締め出す。
 * データそのものは Row Level Security で守るので、ここは画面の入口の守り。
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);

  if (claims && !isAllowedEmail(claims.email)) {
    // 通信に失敗しても cookie は必ず消えるよう、この端末のセッションだけを消す
    await supabase.auth.signOut({ scope: "local" });
    return redirectWithCookies(request, response, "/login?error=forbidden");
  }
  if (!claims && !isPublic) {
    return redirectWithCookies(request, response, "/login");
  }
  return response;
}

function redirectWithCookies(request: NextRequest, from: NextResponse, to: string) {
  const redirect = NextResponse.redirect(new URL(to, request.url));
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: [
    // 静的ファイル・アイコン・マニフェストは除く
    "/((?!_next/static/|_next/image/|favicon\\.ico$|icon/|apple-icon$|manifest\\.webmanifest$).*)",
  ],
};
