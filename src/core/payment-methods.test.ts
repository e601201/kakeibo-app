import { describe, expect, it } from "vitest";
import { initialPaymentMethods, paymentMethodLabel } from "./payment-methods";

describe("支払方法", () => {
  it("初めて使うときの支払方法が決まった順で入っている", () => {
    expect(initialPaymentMethods().map(paymentMethodLabel)).toEqual([
      "現金",
      "クレジットカード（三井住友カード）",
      "クレジットカード（エポスカード）",
      "電子マネー（PayPay）",
      "電子マネー（Suica）",
      "口座振替",
      "その他",
    ]);
  });
});
