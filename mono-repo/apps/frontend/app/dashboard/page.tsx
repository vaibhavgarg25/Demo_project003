// apps/dashboard/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { KpiTile } from "@/components/KpiTile";
import { RecommendationCard } from "@/components/RecommendationCard";
import { BayView } from "@/components/BayView";
import CircularProgress from "@/components/CircularProgress";
import { fetchTrainsets, type Trainset } from "@/lib/mock-data";
import { daysUntil } from "@/lib/utils";

export default function Dashboard() {
  const [trainsets, setTrainsets] = useState<Trainset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchTrainsets();
        if (!mounted) return;
        setTrainsets(data || []);
        setError(null);
      } catch (e) {
        console.error(e);
        setError("Failed to load trainsets");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // helper to accept string | Date
  const daysUntilSafe = (d?: string | Date | null) => {
    if (!d) return Infinity;
    if (typeof d === "string") return daysUntil(d);
    if (d instanceof Date) return daysUntil(d.toISOString());
    return daysUntil(String(d));
  };

  if (loading) {
    return (
      <div className="min-h-screen app-gradient p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen app-gradient p-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-rose-600">Error</h3>
          <p className="text-muted">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // -------------------------
  // Health score calculation
  // -------------------------
  function computeRawHealth(trainset: any): number {
    const safeNum = (v: any, cap = 100) =>
      typeof v === "number" && !Number.isNaN(v)
        ? Math.max(0, Math.min(v, cap))
        : 0;

    // fitness (boolean -> percent)
    const fitnessFlags = [
      trainset.fitness?.rollingStockFitnessStatus,
      trainset.fitness?.signallingFitnessStatus,
      trainset.fitness?.telecomFitnessStatus,
    ];
    const fitnessPopulated = fitnessFlags.filter(
      (f) => f !== undefined && f !== null
    ).length;
    const fitnessTrue = fitnessFlags.filter((f) => f === true).length;
    const fitnessPercent = fitnessPopulated
      ? (fitnessTrue / fitnessPopulated) * 100
      : 50;

    // expiry penalty
    const expiryDates = [
      trainset.fitness?.rollingStockFitnessExpiryDate,
      trainset.fitness?.signallingFitnessExpiryDate,
      trainset.fitness?.telecomFitnessExpiryDate,
    ].filter(Boolean);
    const minExpiryDays = expiryDates.length
      ? Math.min(...expiryDates.map((d: any) => daysUntilSafe(d)))
      : Infinity;
    let expiryPenalty = 0;
    if (minExpiryDays <= 0) expiryPenalty = 40;
    else if (minExpiryDays <= 7) expiryPenalty = 20;
    else if (minExpiryDays <= 30) expiryPenalty = 10;

    // jobs penalty
    const openJobs = trainset.jobCardStatus?.openJobCards ?? 0;
    const jobPenalty = Math.min(openJobs * 3, 30);

    // mileage score (decay)
    const mileage = safeNum(trainset.mileage?.totalMileageKM ?? 0, 1_000_000);
    const mileageScore = 100 * (1 / (1 + Math.pow(mileage / 180000, 1.2)));

    // wear score
    const brake = safeNum(trainset.mileage?.brakepadWearPercent ?? 0, 100);
    const hvac = safeNum(trainset.mileage?.hvacWearPercent ?? 0, 100);
    const wearScore =
      brake || hvac ? Math.max(0, 100 - (brake + hvac) / 2) : 70;

    // other signals
    const cleaningPenalty = trainset.cleaning?.cleaningRequired ? 10 : 0;
    const brandingBoost = trainset.branding?.brandingActive ? 4 : 0;
    const opScore = safeNum(trainset.operations?.score ?? 70, 100);

    const raw =
      0.28 * fitnessPercent +
      0.22 * mileageScore +
      0.2 * wearScore +
      0.2 * opScore +
      0.1 * 100 -
      expiryPenalty -
      jobPenalty -
      cleaningPenalty +
      brandingBoost;

    return Math.round(Math.max(0, Math.min(100, raw)));
  }

  function mapToDisplayHealth(raw: number): number {
    // shift 0..100 → 70..90
    return Math.round(70 + (raw / 100) * 20);
  }

  function getHealthScore(trainset: any): number {
    return mapToDisplayHealth(computeRawHealth(trainset));
  }

  function getRecommendationReason(trainset: Trainset): string {
    const openJobs = trainset.jobCardStatus?.openJobCards ?? 0;
    const totalMileage = trainset.mileage?.totalMileageKM ?? 0;
    const soon = [
      trainset.fitness?.rollingStockFitnessExpiryDate,
      trainset.fitness?.signallingFitnessExpiryDate,
      trainset.fitness?.telecomFitnessExpiryDate,
    ]
      .filter(Boolean)
      .map((d: any) => daysUntilSafe(d))
      .reduce((a, b) => Math.min(a, b), Infinity);

    if (soon <= 0) return `Fitness expired — ground until recertified`;
    if (openJobs > 5) return `${openJobs} open jobs — prioritize maintenance`;
    if (totalMileage > 250000)
      return `High mileage (${Math.round(totalMileage)} km) — inspect`;

    return `${openJobs} open jobs • ${Math.round(
      totalMileage
    ).toLocaleString()} km`;
  }

  const totalTrainsets = trainsets.length;
  const inServiceTrains = trainsets.filter(
    (t) =>
      t.operations?.operationalStatus?.toLowerCase() === "in_service" ||
      (t as any).status === "Active"
  ).length;
  const maintenanceTrainsets = trainsets.filter(
    (t) =>
      t.operations?.operationalStatus?.toLowerCase() === "under_maintenance" ||
      (t as any).status === "Maintenance"
  ).length;
  const standbyTrainsets = trainsets.filter(
    (t) =>
      t.operations?.operationalStatus?.toLowerCase() === "standby" ||
      (t as any).status === "Standby"
  ).length;

  const availabilityRate =
    totalTrainsets > 0
      ? Math.round((inServiceTrains / totalTrainsets) * 100)
      : 0;

  const avgMileage =
    totalTrainsets > 0
      ? Math.round(
          trainsets.reduce(
            (s, t) => s + (t.mileage?.totalMileageKM || 0),
            0
          ) / totalTrainsets
        )
      : 0;

  const totalOpenJobs = trainsets.reduce(
    (s, t) => s + (t.jobCardStatus?.openJobCards || 0),
    0
  );

  const fitnessExpiringSoon = trainsets.filter((t) => {
    if (!t.fitness?.rollingStockFitnessExpiryDate) return false;
    const d = daysUntilSafe(t.fitness.rollingStockFitnessExpiryDate as any);
    return d <= 30 && d > 0;
  }).length;

  const topTrains = trainsets
    .map((t) => ({
      t,
      raw: computeRawHealth(t),
      health: getHealthScore(t),
      reason: getRecommendationReason(t),
    }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 13);

  const topRecommendations = topTrains
    .slice(0, 3)
    .map((x) => ({
      trainset: x.t,
      reason: x.reason,
      confidence: x.health,
    }));

  return (
    <div className="min-h-screen app-gradient p-6 space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiTile
          title="Fleet Availability"
          value={`${availabilityRate}%`}
          subtitle={`${inServiceTrains}/${totalTrainsets} in service`}
          progress={availabilityRate}
          sparklineData={[availabilityRate]}
          trend={
            availabilityRate >= 85
              ? "up"
              : availabilityRate >= 75
              ? "neutral"
              : "down"
          }
        />
        <KpiTile
          title="Average Mileage"
          value={`${avgMileage.toLocaleString()}`}
          subtitle="km per trainset"
          sparklineData={[avgMileage]}
          trend={
            avgMileage < 200000
              ? "up"
              : avgMileage < 350000
              ? "neutral"
              : "down"
          }
        />
        <KpiTile
          title="In Maintenance"
          value={maintenanceTrainsets}
          subtitle={`${
            totalTrainsets > 0
              ? Math.round((maintenanceTrainsets / totalTrainsets) * 100)
              : 0
          }% of fleet`}
          progress={
            totalTrainsets > 0
              ? Math.round((maintenanceTrainsets / totalTrainsets) * 100)
              : 0
          }
          sparklineData={[maintenanceTrainsets]}
          trend="down"
        />
        <KpiTile
          title="Open Job Cards"
          value={totalOpenJobs}
          subtitle={`${fitnessExpiringSoon} fitness expiring`}
          trend={totalOpenJobs > 10 ? "up" : "neutral"}
        />
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Trains */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-text">
            Top 13 Trains by Health
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topTrains.map((item, idx) => (
              <div
                key={item.t.trainID || idx}
                className="glass-card p-4 flex flex-col items-center"
              >
                <CircularProgress value={item.health} size={72} thickness={8} />

                <div className="mt-3 text-center w-full">
                  <div className="font-semibold text-text">
                    {item.t.trainname}
                  </div>
                  <div className="text-xs text-muted">
                    Train {item.t.trainID} • Bay{" "}
                    {item.t.stabling?.bayPositionID ??
                      (item.t as any).stabling_position ??
                      "N/A"}
                  </div>
                  <div className="mt-2 text-sm text-muted">{item.reason}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-text mt-2">
              Recommended for Service
            </h3>
            <div className="space-y-3 mt-3">
              {topRecommendations.map((r, i) => (
                <RecommendationCard
                  key={i}
                  trainset={r.trainset}
                  reason={r.reason}
                  confidence={r.confidence}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium text-text">Bay View</div>
              <div className="text-xs text-muted">Live</div>
            </div>
            <BayView trainsets={trainsets} layout="2x8" />
          </div>

          <div className="glass-card p-4">
            <div className="font-medium">Fleet Distribution</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm text-muted">In Service</div>
                <div className="font-semibold text-teal-600 text-xl">
                  {inServiceTrains}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted">Maintenance</div>
                <div className="font-semibold text-rose-500 text-xl">
                  {maintenanceTrainsets}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted">Standby</div>
                <div className="font-semibold text-muted text-xl">
                  {standbyTrainsets}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="font-medium">Alerts</div>
            <div className="mt-2 text-sm text-muted">
              {topRecommendations.length
                ? `${topRecommendations.length} high-priority recommendations`
                : "No critical alerts"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
