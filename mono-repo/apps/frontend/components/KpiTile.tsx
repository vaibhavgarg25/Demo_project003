import type React from "react"
import { Suspense } from "react"
import { Sparkline } from "./charts/Sparkline"

interface KpiTileProps {
  title: string
  value: string | number
  subtitle?: string
  progress?: number
  sparklineData?: number[]
  trend?: "up" | "down" | "neutral"
}

export function KpiTile({ title, value, subtitle, progress = 0, sparklineData, trend = "neutral" }: KpiTileProps) {
  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-muted",
  }

  return (
    <div className="bg-surface border border-border rounded-xl shadow-md p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted mb-1">{title}</p>
          <p className="text-2xl font-bold text-text mb-1">{value}</p>
          {subtitle && <p className={`text-xs ${trendColors[trend]}`}>{subtitle}</p>}
        </div>

        {progress > 0 && (
          <div className="relative w-12 h-12">
            <div className="kpi-ring w-12 h-12" style={{ "--progress": progress } as React.CSSProperties}>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {sparklineData && (
        <div className="mt-4 h-8">
          <Suspense fallback={<div className="h-8 bg-border rounded animate-pulse" />}>
            <Sparkline data={sparklineData} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
