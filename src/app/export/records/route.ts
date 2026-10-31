import { recordsCsv } from "@/core/csv";
import { todayInJapan } from "@/core/month";
import { loadCategories } from "@/lib/data/categories";
import { loadAllExpenses } from "@/lib/data/expenses";
import { loadAllIncomes } from "@/lib/data/incomes";
import { loadPaymentMethods } from "@/lib/data/payment-methods";
import { createClient } from "@/lib/supabase/server";
import { csvResponse } from "../csv-response";

/** 記録（支出・振替・収入）のCSV。本人かどうかは proxy が確かめ、データは Row Level Security が守る。 */
export async function GET() {
  const supabase = await createClient();
  const [expenses, incomes, categories, paymentMethods] = await Promise.all([
    loadAllExpenses(supabase),
    loadAllIncomes(supabase),
    loadCategories(supabase),
    loadPaymentMethods(supabase),
  ]);
  return csvResponse(
    recordsCsv({ expenses, incomes, categories, paymentMethods }),
    `kakeibo-records-${todayInJapan(new Date())}.csv`,
  );
}
