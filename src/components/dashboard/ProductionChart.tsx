"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PLATFORM_COLORS: Record<string, string> = {
  YOUTUBE: "#f87171",
  TIKTOK: "#e7ebfa",
  INSTAGRAM: "#e879f9",
  LINKEDIN: "#22d3ee",
  FACEBOOK: "#6d5bff",
  BLOG: "#34d399",
  NEWSLETTER: "#fbbf24",
};

export interface ProductionDatum {
  day: string;
  [platform: string]: string | number;
}

export function ProductionChart({ data }: { data: ProductionDatum[] }) {
  const platforms = Array.from(
    new Set(data.flatMap((d) => Object.keys(d).filter((k) => k !== "day")))
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1d2440" vertical={false} />
        <XAxis dataKey="day" stroke="#7c85ab" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#7c85ab" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#10162b",
            border: "1px solid #1d2440",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {platforms.map((platform) => (
          <Bar
            key={platform}
            dataKey={platform}
            stackId="production"
            fill={PLATFORM_COLORS[platform] ?? "#6d5bff"}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
