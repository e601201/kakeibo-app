import { NextResponse } from "next/server";
import { recordOptions } from "@/core/record-requests";
import { loadCategories } from "@/lib/data/categories";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { withOwnerClient } from "@/lib/supabase/owner";
import { isAuthorized, unauthorized } from "../api-request";

/** 記録するときに使える、費目・支払方法・収入の種類の名前。 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  const options = await withOwnerClient(async (supabase) => {
    const [categories, paymentMethods] = await Promise.all([
      loadCategories(supabase),
      loadPaymentMethods(supabase),
    ]);
    return recordOptions(categories, paymentMethods);
  });
  return NextResponse.json(options);
}
