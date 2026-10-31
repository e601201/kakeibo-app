import { describe, expect, it } from "vitest";
import type { Category } from "./categories";
import { emergencyFundStatus, validateEmergencyFund } from "./emergency-fund";

// 金額は作り物の値
const categories: Category[] = [
  { id: "save", name: "貯蓄・投資", kind: "transfer", sortOrder: 0, memo: "", hidden: false },
  { id: "nisa", name: "NISA", kind: "transfer", sortOrder: 1, memo: "", hidden: true },
  { id: "food", name: "食費（食材）", kind: "expense", sortOrder: 2, memo: "", hidden: false },
];

const record = (categoryId: string, date: string, amount: number) => ({ categoryId, date, amount });

const fund = { startingSavings: 100000, target: 300000 };

describe("生活防衛資金", () => {
  it("現在額は、開始時の貯蓄額にその月末までの振替の累計を足した額", () => {
    const records = [
      record("save", "2026-11-25", 50000),
      record("save", "2026-12-31", 50000),
      record("save", "2027-01-01", 50000),
    ];
    expect(emergencyFundStatus(fund, records, categories, "2026-12")).toEqual({
      current: 200000,
      achievementRate: 200000 / 300000,
      remaining: 100000,
    });
  });

  it("過去の月はその月末時点の額で見る", () => {
    const records = [record("save", "2026-11-25", 50000), record("save", "2026-12-25", 50000)];
    expect(emergencyFundStatus(fund, records, categories, "2026-11").current).toBe(150000);
  });

  it("支出は数えず、非表示の振替の費目を含むすべての振替を数える", () => {
    const records = [record("food", "2026-11-10", 9000), record("nisa", "2026-11-20", 10000)];
    expect(emergencyFundStatus(fund, records, categories, "2026-11").current).toBe(110000);
  });

  it("目標を超えても達成率は100%で、目標までの残りは0円", () => {
    const records = [record("save", "2026-11-25", 250000)];
    expect(emergencyFundStatus(fund, records, categories, "2026-11")).toEqual({
      current: 350000,
      achievementRate: 1,
      remaining: 0,
    });
  });

  it("目標ちょうどで達成率は100%、残りは0円", () => {
    const records = [record("save", "2026-11-25", 200000)];
    expect(emergencyFundStatus(fund, records, categories, "2026-11")).toMatchObject({
      achievementRate: 1,
      remaining: 0,
    });
  });

  it("振替の返金で現在額がマイナスになっても、達成率は0%より下にならない", () => {
    const records = [record("save", "2026-11-25", -150000)];
    expect(emergencyFundStatus(fund, records, categories, "2026-11")).toEqual({
      current: -50000,
      achievementRate: 0,
      remaining: 350000,
    });
  });
});

describe("生活防衛資金の設定", () => {
  it("開始時の貯蓄額と目標額を円の整数で登録できる", () => {
    expect(validateEmergencyFund({ startingSavings: "100,000", target: "300000" })).toEqual({
      ok: true,
      value: { startingSavings: 100000, target: 300000 },
    });
  });

  it("開始時の貯蓄額は0円でもよい", () => {
    expect(validateEmergencyFund({ startingSavings: "0", target: "300000" })).toMatchObject({
      ok: true,
      value: { startingSavings: 0 },
    });
  });

  it("目標額は1円以上、開始時の貯蓄額はマイナスにできず、どちらも空にできない", () => {
    expect(validateEmergencyFund({ startingSavings: "-1", target: "0" })).toEqual({
      ok: false,
      errors: {
        startingSavings: "0円以上で入れてください",
        target: "1円以上で入れてください",
      },
    });
    expect(validateEmergencyFund({ startingSavings: "", target: "" })).toEqual({
      ok: false,
      errors: { startingSavings: "金額を入れてください", target: "金額を入れてください" },
    });
  });
});
