function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`環境変数 ${name} が設定されていません（.env.example を参照）`);
  return value;
}

// NEXT_PUBLIC_ の値はビルド時に埋め込まれるため、process.env.X と直接書く必要がある。
export const supabaseUrl = () =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabasePublishableKey = () =>
  required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

/** ログインを許す本人のメールアドレスか。サーバー側でだけ使う。 */
export function isAllowedEmail(email: string | undefined): boolean {
  const allowed = allowedEmail();
  return !!email && email.trim().toLowerCase() === allowed.trim().toLowerCase();
}

// 以下は画面を開かずに記録するAPI（docs/adr/0002-record-api-with-token.md）でだけ使う。サーバー側でだけ読む。

/** Supabase の秘密の鍵。本人のセッションを作るためだけに使い、データの読み書きには使わない。 */
export const supabaseSecretKey = () =>
  required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);

/** ログインを許す本人のメールアドレス。 */
export const allowedEmail = () => required("ALLOWED_EMAIL", process.env.ALLOWED_EMAIL);

/** APIを呼ぶための、本人だけが知る合い言葉。 */
export const apiToken = () => required("KAKEIBO_API_TOKEN", process.env.KAKEIBO_API_TOKEN);
