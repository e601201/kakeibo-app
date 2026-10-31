import { NextResponse } from "next/server";
import { yen } from "@/app/_components/format";
import { todayInJapan } from "@/core/month";
import { incomeFromRequest } from "@/core/record-requests";
import { INCOME_KIND_LABELS } from "@/core/records";
import { insertIncome } from "@/lib/data/incomes";
import { withOwnerClient } from "@/lib/supabase/owner";
import { isAuthorized, jsonBody, unauthorized } from "../api-request";

/** 収入を記録する。間違いがあれば 400 で欄ごとの理由を返し、何も記録しない。 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  const result = incomeFromRequest(await jsonBody(request), todayInJapan(new Date()));
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });

  await withOwnerClient((supabase) => insertIncome(supabase, result.value));
  const income = result.value;
  return NextResponse.json(
    {
      message: `${income.date} ${INCOME_KIND_LABELS[income.kind]} ${yen(income.amount)}を収入として記録しました`,
    },
    { status: 201 },
  );
}
