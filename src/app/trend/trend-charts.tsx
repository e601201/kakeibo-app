"use client";

import { useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compactYen, yen } from "@/app/_components/format";

// dataviz の参照パレットの8色。9個目の費目からは同じ色を点線で使う
const SERIES_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
] as const;
const DASH = "5 3";

function lineStyle(index: number): { color: string; dash: string | undefined } {
  return {
    color: SERIES_COLORS[index % SERIES_COLORS.length],
    dash: index < SERIES_COLORS.length ? undefined : DASH,
  };
}

export type TrendChartItem = {
  id: string;
  name: string;
  /** 月ごとの実績（並べる月と同じ順） */
  amounts: number[];
};

/**
 * 費目を1枚の折れ線グラフに重ね、下のチェックボックスで線を出し入れする。
 * months は横軸に出す月の名前。drawnMonths は線を描く月の数（来月以降は描かない）。
 */
export function TrendLineChart({
  items,
  months,
  drawnMonths,
}: {
  items: TrendChartItem[];
  months: string[];
  drawnMonths: number;
}) {
  const hidden = useHiddenCategories();
  if (items.length === 0) return null;

  const styled = items.map((item, i) => ({ ...item, ...lineStyle(i) }));
  const visible = styled.filter((item) => !hidden.has(item.id));
  const data = months.map((month, m) => ({
    month,
    ...Object.fromEntries(
      items.map((item) => [item.id, m < drawnMonths ? item.amounts[m] : undefined]),
    ),
  }));

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3">
      {/* 押したときに出るフォーカスの枠は消す */}
      <div className="h-64 [&_*:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: "#d4d4d8" }}
              tick={{ fontSize: 10, fill: "#71717a" }}
              interval={1}
            />
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={compactYen}
            />
            <Tooltip
              // 表示中の費目を金額の大きい順に出す
              itemSorter={(entry) => -Number(entry.value ?? 0)}
              formatter={(value) => yen(Number(value))}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            />
            {visible.map((item) => (
              <Line
                key={item.id}
                dataKey={item.id}
                name={item.name}
                stroke={item.color}
                strokeDasharray={item.dash}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            className="text-emerald-700 underline"
            onClick={() => showCategories(items.map((item) => item.id))}
          >
            すべて選ぶ
          </button>
          <button
            type="button"
            className="text-emerald-700 underline"
            onClick={() => hideCategories(items.map((item) => item.id))}
          >
            すべて外す
          </button>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {styled.map((item) => (
            <li key={item.id}>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!hidden.has(item.id)}
                  onChange={(e) =>
                    e.target.checked ? showCategories([item.id]) : hideCategories([item.id])
                  }
                />
                {/* 線と同じ色・線の種類の印。凡例を兼ねる */}
                <svg aria-hidden width="18" height="6">
                  <line
                    x1="1"
                    y1="3"
                    x2="17"
                    y2="3"
                    stroke={item.color}
                    strokeWidth="2.5"
                    strokeDasharray={item.dash}
                  />
                </svg>
                {item.name}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 外した費目の id をこの端末に覚えておく。覚えていない費目（初めて・あとから追加した費目）はオン
const STORAGE_KEY = "kakeibo:trend:hidden-categories";
const CHANGE_EVENT = "kakeibo:trend:hidden-categories-change";
const NONE = "[]";
// 端末に覚えられない環境では、ページを開いている間だけここで覚える
let unsaved = NONE;

function readHidden(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? NONE;
  } catch {
    return unsaved;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function parseHidden(text: string): Set<string> {
  try {
    const value: unknown = JSON.parse(text);
    return new Set(Array.isArray(value) ? value.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

function useHiddenCategories(): Set<string> {
  const text = useSyncExternalStore(subscribe, readHidden, () => NONE);
  return parseHidden(text);
}

function writeHidden(hidden: Set<string>) {
  const text = JSON.stringify([...hidden]);
  unsaved = text;
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {
    // 覚えられなくても、その場の切り替えはする
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function hideCategories(ids: string[]) {
  const hidden = parseHidden(readHidden());
  ids.forEach((id) => hidden.add(id));
  writeHidden(hidden);
}

function showCategories(ids: string[]) {
  const hidden = parseHidden(readHidden());
  ids.forEach((id) => hidden.delete(id));
  writeHidden(hidden);
}
