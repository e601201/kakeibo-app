"use client";

import { useActionState } from "react";
import { FieldError, inputClass } from "@/app/_components/form";
import type { EmergencyFund } from "@/core/emergency-fund";
import { type EmergencyFundFormState, saveEmergencyFundAction } from "./actions";

export function EmergencyFundForm({ fund }: { fund: EmergencyFund | undefined }) {
  const [state, action, pending] = useActionState<EmergencyFundFormState, FormData>(
    saveEmergencyFundAction,
    {},
  );
  const values = state.values ?? {
    startingSavings: fund ? String(fund.startingSavings) : "",
    target: fund ? String(fund.target) : "",
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm">開始時の貯蓄額（円）</span>
        <input
          name="startingSavings"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={values.startingSavings}
          required
          className={`${inputClass} text-right`}
        />
        <FieldError message={state.errors?.startingSavings} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm">目標額（円）</span>
        <input
          name="target"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={values.target}
          required
          className={`${inputClass} text-right`}
        />
        <FieldError message={state.errors?.target} />
      </label>
      {state.savedMessage && !pending && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.savedMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-4 text-lg font-bold text-white disabled:opacity-50"
      >
        保存する
      </button>
    </form>
  );
}
