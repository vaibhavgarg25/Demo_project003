// components/KpiTile.tsx
"use client";

import React from "react";
import { Sparkline } from "./Sparkline"; // optional — small sparkline component (see note)
import CircularProgress from "./CircularProgress"; // your existing component
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

type Trend = "up" | "down" | "neutral";

export interface KpiTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number; // 0..100 will show circular progress
  sparklineData?: number[]; // optional mini sparkline
  trend?: Trend;
  compact?: boolean;
  className?: string;
  action?: React.ReactNode; // optional action / icon in bottom-right
}

export const KpiTile: React.FC<KpiTileProps> = ({
  title,
  value,
  subtitle,
  progress,
  sparklineData,
  trend = "neutral",
  compact = false,
  className = "",
  action,
}) => {
  const trendIcon =
    trend === "up" ? (
      <ArrowUp className="h-4 w-4" />
    ) : trend === "down" ? (
      <ArrowDown className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    );

  return (
    <article
      role="region"
      aria-label={title}
      className={`kpi-tile glass-card flex flex-col justify-between ${
        compact ? "p-3" : "p-5"
      } ${className}`}
    >
      {/* top row: title and small progress */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-[var(--muted)]">{title}</div>
        </div>

        {/* small circular progress (if provided) */}
        {typeof progress === "number" ? (
          <div className="kpi-ring">
            <CircularProgress
              value={progress}
              size={48}
              thickness={6}
              className="text-[var(--progress-text-color)] text-xs font-semibold"
              aria-hidden={false}
            />
          </div>
        ) : (
          <div aria-hidden className="w-12" />
        )}
      </div>

      {/* main number */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div
            className="kpi-number text-[var(--fg)]"
            style={{ fontSize: compact ? "1.25rem" : "2rem" }}
          >
            {value}
          </div>
          {subtitle && (
            <div
              className="kpi-sub mt-1"
              style={{ color: "var(--muted)", fontSize: compact ? ".8rem" : ".95rem" }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* trend badge */}
        <div
          className={`kpi-badge flex items-center justify-center gap-2 ${
            trend === "up"
              ? "bg-[rgba(4,120,112,0.08)] text-[var(--teal-600)]"
              : trend === "down"
              ? "bg-[rgba(220,38,38,0.06)] text-[rgb(220,38,38)]"
              : "bg-[rgba(120,120,120,0.06)] text-[var(--muted)]"
          }`}
          aria-hidden
          title={trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable"}
        >
          {trendIcon}
          <span className="text-xs font-semibold">
            {trend === "up" ? "Up" : trend === "down" ? "Down" : "Stable"}
          </span>
        </div>
      </div>

      {/* bottom row: sparkline and action */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          {Array.isArray(sparklineData) && sparklineData.length ? (
            <div className="h-8">
              {/* use your sparkline component or simple inline svg */}
              <Sparkline data={sparklineData} />
            </div>
          ) : (
            <div className="h-8" />
          )}
        </div>

        <div className="ml-3">{action ?? null}</div>
      </div>
    </article>
  );
};

export default KpiTile;
