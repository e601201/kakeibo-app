import { Suspense } from "react";
import { GoogleLoginButton } from "./google-login-button";

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "このアカウントでは使えません。本人のGoogleアカウントでログインしてください。",
  callback: "ログインに失敗しました。もう一度お試しください。",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-bold">家計簿</h1>
      <Suspense>
        <LoginError searchParams={searchParams} />
      </Suspense>
      <GoogleLoginButton />
    </main>
  );
}

async function LoginError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERROR_MESSAGES[error] : undefined;
  if (!message) return null;
  return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{message}</p>;
}
