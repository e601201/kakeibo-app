import Link from "next/link";
import { addMonths } from "@/core/month";
import { monthLabel } from "./format";

/** 前の月・次の月へ移るリンク。ほかの条件（検索語など）は引き継がない。 */
export function MonthNav({ month }: { month: string }) {
  return (
    <nav className="flex items-center justify-between">
      <Link href={`?month=${addMonths(month, -1)}`} className="px-2 py-1 text-emerald-700">
        ← 前の月
      </Link>
      <span className="text-lg font-bold">{monthLabel(month)}</span>
      <Link href={`?month=${addMonths(month, 1)}`} className="px-2 py-1 text-emerald-700">
        次の月 →
      </Link>
    </nav>
  );
}
