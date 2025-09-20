// components/BayView.tsx
"use client";

import React from "react";
import type { Trainset } from "@/lib/mock-data";

interface BayViewProps {
  trainsets: Trainset[];
  layout?: "2x8" | "default";
}

/**
 * BayView supports:
 * - layout="2x8" (2 columns x 8 rows -> 16 bays)
 * - layout="default" (falls back to 3x4 or provided length)
 */
export function BayView({ trainsets, layout = "default" }: BayViewProps) {
  // Build a map: bayId -> train
  const bayMap: Record<string, Trainset> = {};
  trainsets.forEach((t) => {
    const bay = (t.stabling && (t.stabling as any).bayPositionID) || (t as any).stabling_position;
    if (bay != null) bayMap[String(bay)] = t;
  });

  let bays: string[] = [];

  if (layout === "2x8") {
    // 16 bays numbered 1..16
    bays = Array.from({ length: 16 }).map((_, i) => String(i + 1));
  } else {
    // default: 12 bays
    bays = Array.from({ length: 12 }).map((_, i) => String(i + 1));
  }

  // Helper to show initials safely
  const initials = (t?: Trainset) => {
    const name = t?.trainname || t?.trainID || (t as any)?.id;
    if (!name) return "—";
    const parts = String(name).split(/\s+/);
    if (parts.length === 1) return String(name).slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  return (
    <div className="glass-card p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-text">Bay View</div>
        <div className="text-xs text-muted">Live positions</div>
      </div>

      <div
        className={`grid gap-3 ${
          layout === "2x8" ? "grid-cols-2" : "grid-cols-3 md:grid-cols-3"
        }`}
      >
        {bays.map((b) => {
          const t = bayMap[b];
          return (
            <div
              key={b}
              className="p-3 bg-white/40 dark:bg-black/40 rounded-md border border-white/8 flex flex-col items-center justify-center text-center min-h-[72px]"
            >
              <div className="text-xs text-muted mb-2">Bay {b}</div>
              {t ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
                    {initials(t)}
                  </div>
                  <div className="mt-2 text-xs text-muted truncate w-full">{t.trainname}</div>
                </>
              ) : (
                <div className="text-sm text-muted">Empty</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
