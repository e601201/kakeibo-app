import { NextResponse } from "next/server";
import { yen } from "@/app/_components/format";
import { CATEGORY_KIND_LABELS } from "@/core/categories";
import { todayInJapan } from "@/core/month";
import { expenseFromRequest } from "@/core/record-requests";
import { expenseKind } from "@/core/records";
import { loadCategories } from "@/lib/data/categories";
import { insertExpense } from "@/lib/data/expenses";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { withOwnerClient } from "@/lib/supabase/owner";
import { isAuthorized, jsonBody, unauthorized } from "../api-request";

/** 支出・振替を記録する。間違いがあれば 400 で欄ごとの理由を返し、何も記録しない。 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  const body = await jsonBody(request);
  return withOwnerClient(async (supabase) => {
    const [categories, paymentMethods] = await Promise.all([
      loadCategories(supabase),
      loadPaymentMethods(supabase),
    ]);
    const result = expenseFromRequest(body, categories, paymentMethods, todayInJapan(new Date()));
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });

    await insertExpense(supabase, result.value);
    const expense = result.value;
    const categoryName = categories.find((c) => c.id === expense.categoryId)?.name ?? "";
    const kind = CATEGORY_KIND_LABELS[expenseKind(expense, categories)];
    return NextResponse.json(
      {
        message: `${expense.date} ${categoryName} ${yen(expense.amount)}を${kind}として記録しました`,
      },
      { status: 201 },
    );
  });
}
