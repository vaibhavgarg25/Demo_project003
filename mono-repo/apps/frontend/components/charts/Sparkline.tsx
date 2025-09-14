"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

interface SparklineProps {
  data: number[]
  color?: string
}

export function Sparkline({ data, color = "currentColor" }: SparklineProps) {
  const chartData = data.map((value, index) => ({
    index,
    value,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
