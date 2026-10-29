import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./env";

/** Server Component・Route Handler・Server Action で使う Supabase クライアント。 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からは cookie を書けない。セッションの更新は proxy が行う。
        }
      },
    },
  });
}

/**
 * Server Action で使う、ログインしていることを確かめた Supabase クライアント。
 * 本人かどうかは proxy が確かめ、データは Row Level Security が守る。
 */
export async function createSignedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("ログインしていません");
  return supabase;
}
