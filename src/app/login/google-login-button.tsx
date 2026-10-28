"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleLoginButton() {
  async function login() {
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={login}
      className="w-full max-w-xs rounded-xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white active:bg-emerald-700"
    >
      Googleでログイン
    </button>
  );
}
