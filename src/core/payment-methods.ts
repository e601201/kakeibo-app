/** 支払方法。名前（現金・クレジットカードなど）と、カード・サービス名を持つ。 */
export type PaymentMethod = {
  id: string;
  name: string;
  /** カード・サービス名。現金などでは空。 */
  detail: string;
  sortOrder: number;
};

/** 保存する前の支払方法（id はデータベースが付ける）。 */
export type NewPaymentMethod = Omit<PaymentMethod, "id">;

const INITIAL_PAYMENT_METHODS: readonly { name: string; detail: string }[] = [
  { name: "現金", detail: "" },
  { name: "クレジットカード", detail: "三井住友カード" },
  { name: "クレジットカード", detail: "エポスカード" },
  { name: "電子マネー", detail: "PayPay" },
  { name: "電子マネー", detail: "Suica" },
  { name: "口座振替", detail: "" },
  { name: "その他", detail: "" },
];

/** 初めて使うときに入れておく支払方法。 */
export function initialPaymentMethods(): NewPaymentMethod[] {
  return INITIAL_PAYMENT_METHODS.map((m, i) => ({ ...m, sortOrder: i }));
}

/** 画面や書き出しで使う支払方法の名前。例：クレジットカード（三井住友カード） */
export function paymentMethodLabel(method: Pick<PaymentMethod, "name" | "detail">): string {
  return method.detail ? `${method.name}（${method.detail}）` : method.name;
}
