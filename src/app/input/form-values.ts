import type { ExpenseInput, IncomeInput } from "@/core/records";
import { formText } from "@/lib/form-data";

// 支出・振替と収入のフォームから送られた値。入力画面と修正画面で使う

export function expenseInputOf(formData: FormData): ExpenseInput {
  return {
    date: formText(formData, "date"),
    categoryId: formText(formData, "categoryId"),
    amount: formText(formData, "amount"),
    description: formText(formData, "description"),
    paymentMethodId: formText(formData, "paymentMethodId"),
    memo: formText(formData, "memo"),
  };
}

export function incomeInputOf(formData: FormData): IncomeInput {
  return {
    date: formText(formData, "date"),
    kind: formText(formData, "kind"),
    amount: formText(formData, "amount"),
    memo: formText(formData, "memo"),
  };
}
