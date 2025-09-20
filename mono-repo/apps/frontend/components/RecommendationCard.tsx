// components/RecommendationCard.tsx
"use client";

import React, { useState } from "react";
import CircularProgress from "./CircularProgress";
import { SlideOver } from "./SlideOver";
import type { Trainset } from "@/lib/mock-data";

interface RecommendationCardProps {
  trainset: Trainset;
  reason: string;
  confidence: number; // 0..100
}

export function RecommendationCard({ trainset, reason, confidence }: RecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // normalize data access
  const status = (trainset.operations?.operationalStatus as string) || (trainset.status as string) || "Unknown";
  const bay = trainset.stabling?.bayPositionID ?? (trainset as any).stabling_position ?? "N/A";
  const mileage = trainset.mileage?.totalMileageKM ?? (trainset as any).mileageSinceLastServiceKM ?? 0;
  const openJobs =
    trainset.jobCardStatus?.openJobCards ??
    (Array.isArray((trainset as any).job_cards)
      ? (trainset as any).job_cards.filter((j: any) => j.status === "open").length
      : 0);

  // Fitness expiry days
  const expiryDate =
    trainset.fitness?.rollingStockFitnessExpiryDate ??
    trainset.fitness?.signallingFitnessExpiryDate ??
    trainset.fitness?.telecomFitnessExpiryDate;
  const expiryDays = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // status chip styling
  const statusColors: Record<string, string> = {
    in_service: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    standby: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    under_maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    out_of_service: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    unknown: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200",
  };
  const statusKey = String(status || "unknown").toLowerCase().replace(/\s+/g, "_");
  const statusClass = statusColors[statusKey] ?? statusColors["unknown"];

  // confidence color
  const confidenceColor =
    confidence >= 85 ? "text-teal-600" : confidence >= 75 ? "text-amber-500" : "text-rose-500";

  return (
    <>
      <div
        className="glass-card p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => setShowDetails(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowDetails(true);
        }}
      >
        <div className="flex items-center gap-5">
          {/* Circular health meter */}
          <div className="flex-shrink-0">
            <CircularProgress value={confidence} size={72} thickness={8} />
          </div>

          {/* Train info + reason */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text truncate">
                {trainset.trainname ?? trainset.trainID ?? `Train ${trainset.id ?? ""}`}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                {status}
              </span>
            </div>

            {/* Headline recommendation */}
            <p className={`mt-1 text-sm font-medium ${confidenceColor}`}>
              {reason}
            </p>

            {/* Micro-metrics row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted">
              <span>{openJobs} open job{openJobs === 1 ? "" : "s"}</span>
              <span>{mileage.toLocaleString()} km</span>
              {expiryDays != null && expiryDays !== Infinity && (
                <span>{expiryDays <= 0 ? "Fitness expired" : `${expiryDays}d to expiry`}</span>
              )}
              <span>Bay {bay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SlideOver for details */}
      <SlideOver
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={`Trainset ${trainset.trainname ?? trainset.trainID ?? trainset.id ?? ""}`}
        trainset={trainset}
      />
    </>
  );
}
