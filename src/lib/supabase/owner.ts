import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { allowedEmail, supabasePublishableKey, supabaseSecretKey, supabaseUrl } from "./env";

/**
 * 画面を開かずに記録するAPIで使う、本人としてログインした Supabase クライアント。
 * 秘密の鍵で本人のログイン用リンクを作り、その場で使ってセッションを作る。
 * データは画面と同じく Row Level Security が守る（docs/adr/0002-record-api-with-token.md）。
 * 作ったセッションは、渡した処理が終わったら消す。
 */
export async function withOwnerClient<T>(
  work: (supabase: SupabaseClient) => Promise<T>,
): Promise<T> {
  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(supabaseUrl(), supabaseSecretKey(), noSession);
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: allowedEmail(),
  });
  if (linkError) throw linkError;

  const supabase = createClient(supabaseUrl(), supabasePublishableKey(), noSession);
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (verifyError) throw verifyError;

  try {
    return await work(supabase);
  } finally {
    await supabase.auth.signOut({ scope: "local" });
  }
}
