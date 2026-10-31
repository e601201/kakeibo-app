"use server";

import { refresh } from "next/cache";
import { validateEmergencyFund } from "@/core/emergency-fund";
import { saveEmergencyFund } from "@/lib/data/emergency-fund";
import { formText } from "@/lib/form-data";
import { createSignedInClient } from "@/lib/supabase/server";

type Field = "startingSavings" | "target";

/**
 * フォームに返す結果。間違いがあれば欄ごとの理由と、入れ直さずに済むよう送った値を持つ
 * （React はアクションのあとにフォームを初期値へ戻すため）。
 */
export type EmergencyFundFormState = {
  errors?: Partial<Record<Field, string>>;
  values?: Record<Field, string>;
  savedMessage?: string;
};

export async function saveEmergencyFundAction(
  _prev: EmergencyFundFormState,
  formData: FormData,
): Promise<EmergencyFundFormState> {
  const supabase = await createSignedInClient();
  const values = {
    startingSavings: formText(formData, "startingSavings"),
    target: formText(formData, "target"),
  };
  const result = validateEmergencyFund(values);
  if (!result.ok) return { errors: result.errors, values };

  await saveEmergencyFund(supabase, result.value);
  refresh();
  return { savedMessage: "保存しました" };
}
