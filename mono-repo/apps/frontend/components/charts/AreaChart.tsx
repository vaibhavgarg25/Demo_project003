"use client"

import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface AreaChartProps {
  data: Array<{ name: string; days: number; date?: string }>
}

export function AreaChart({ data }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text)",
          }}
        />
        <Area
          type="monotone"
          dataKey="days"
          stroke="var(--text)"
          fill="var(--text)"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
