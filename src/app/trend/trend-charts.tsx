"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compactYen, yen, yenOrDash } from "@/app/_components/format";

// 支出の費目は青、振替の費目は緑がかった青（dataviz の参照パレットの1番と3番）
const KIND_COLORS = { expense: "#2a78d6", transfer: "#1baf7a" } as const;

export type TrendChartItem = {
  id: string;
  name: string;
  kind: keyof typeof KIND_COLORS;
  total: number;
  average: number | null;
  /** 月ごとの実績。month は表示用の「11月」 */
  points: { month: string; amount: number }[];
};

/** 費目ごとに小さな棒グラフを並べる（費目が多いので、色で見分けずに並べて比べる）。 */
export function TrendCharts({ items }: { items: TrendChartItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: KIND_COLORS[item.kind] }}
              />
              {item.name}
            </span>
            <span className="text-xs text-zinc-500">
              合計 {yen(item.total)}・月平均 {yenOrDash(item.average)}
            </span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={item.points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#e4e4e7" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: "#d4d4d8" }}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  interval={1}
                />
                <YAxis
                  width={36}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  tickFormatter={compactYen}
                />
                <Tooltip
                  cursor={{ fill: "#f4f4f5" }}
                  formatter={(value) => [yen(Number(value)), item.name]}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Bar
                  dataKey="amount"
                  fill={KIND_COLORS[item.kind]}
                  maxBarSize={24}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </li>
      ))}
    </ul>
  );
}
