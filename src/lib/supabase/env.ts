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
  const allowed = required("ALLOWED_EMAIL", process.env.ALLOWED_EMAIL);
  return !!email && email.trim().toLowerCase() === allowed.trim().toLowerCase();
}
