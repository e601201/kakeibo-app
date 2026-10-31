import type { IncomeKind } from "@/core/records";

// フォームの欄の名前。予算は費目ごと、収入の予定は収入の種類ごと
export const budgetField = (categoryId: string) => `budget.${categoryId}`;
export const incomePlanField = (kind: IncomeKind) => `income.${kind}`;
