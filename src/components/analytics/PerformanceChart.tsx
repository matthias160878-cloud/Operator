"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PerformancePoint {
  date: string;
  views: number;
  engagementRate: number;
}

export function PerformanceChart({ data }: { data: PerformancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1d2440" vertical={false} />
        <XAxis dataKey="date" stroke="#7c85ab" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#7c85ab" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#10162b",
            border: "1px solid #1d2440",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey="views" stroke="#6d5bff" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="engagementRate" stroke="#22d3ee" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
