// components/KpiTile.tsx
"use client";

import React, { Suspense } from "react";
import CircularProgress from "./CircularProgress";
import { Sparkline } from "./charts/Sparkline"; // keep your existing sparkline
// if you don't have one, render a placeholder or remove sparkline usage.

interface KpiTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number; // 0..100
  sparklineData?: number[];
  trend?: "up" | "down" | "neutral";
  // optional small note shown under the value
  note?: string;
}

export function KpiTile({
  title,
  value,
  subtitle,
  progress = 0,
  sparklineData,
  trend = "neutral",
  note,
}: KpiTileProps) {
  // color mapping for badge / trend
  const trendColor =
    trend === "up" ? "bg-teal-600 text-white" : trend === "down" ? "bg-rose-500 text-white" : "bg-gray-100 text-muted";

  return (
    <div className="kpi-tile">
      <div className="kpi-top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-sm text-muted">{title}</div>

          <div className="mt-2 flex items-baseline gap-4">
            <div className="kpi-number text-3xl md:text-4xl text-text">
              {value}
            </div>

            {/* small subtitle/badge area */}
            <div className="ml-auto flex items-center gap-2">
              {typeof progress === "number" && !Number.isNaN(progress) && (
                <div className="hidden sm:block">
                  <CircularProgress value={progress} size={56} thickness={8} />
                </div>
              )}
            </div>
          </div>

          {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
        </div>
      </div>

      {/* bottom row: sparkline + meta */}
      <div className="kpi-meta">
        <div style={{ flex: 1 }}>
          {sparklineData ? (
            <Suspense fallback={<div style={{ height: 28 }} />}>
              <Sparkline data={sparklineData} />
            </Suspense>
          ) : (
            <div style={{ height: 28 }} />
          )}
        </div>

        <div className="flex items-center gap-3">
          {note && <div className="text-xs text-muted">{note}</div>}
          {/* small trend badge */}
          <div
            className={`kpi-badge ${trend === "up" ? "bg-teal-600 text-white" : trend === "down" ? "bg-rose-500 text-white" : "bg-gray-100 text-muted"}`}
            aria-hidden
          >
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KpiTile;
