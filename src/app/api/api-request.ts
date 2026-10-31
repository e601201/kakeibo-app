import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { apiToken } from "@/lib/supabase/env";

// 画面を開かずに記録するAPI（docs/api.md）の共通の入口。
// cookie のログインは使わないので、proxy は /api を通し、ここで本人かどうかを確かめる。

/** Authorization: Bearer <KAKEIBO_API_TOKEN> が合っているか。長さで漏れないよう、ハッシュを比べる。 */
export function isAuthorized(request: Request): boolean {
  const sent = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1] ?? "";
  return timingSafeEqual(sha256(sent), sha256(apiToken()));
}

export function unauthorized() {
  return NextResponse.json({ error: "APIトークンが正しくありません" }, { status: 401 });
}

/** 送られたJSON。読めなければ null（家計簿コアが「何も指定していない」として扱う）。 */
export async function jsonBody(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

function sha256(text: string) {
  return createHash("sha256").update(text).digest();
}
