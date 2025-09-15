"use client"

import { Suspense, useEffect, useState } from "react"
import { KpiTile } from "@/components/KpiTile"
import { RecommendationCard } from "@/components/RecommendationCard"
import { AnimatedTrain } from "@/components/AnimatedTrain"
import { fetchTrainsets, type Trainset } from "@/lib/mock-data"
import { daysUntil } from "@/lib/utils"

export default function Dashboard() {
  const [trainsets, setTrainsets] = useState<Trainset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTrainsets = async () => {
      try {
        setLoading(true)
        const data = await fetchTrainsets()
        setTrainsets(data)
        setError(null)
      } catch (err) {
        console.error("Failed to load trainsets:", err)
        setError("Failed to load trainset data")
      } finally {
        setLoading(false)
      }
    }

    loadTrainsets()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-border rounded mb-2"></div>
              <div className="h-8 bg-border rounded mb-2"></div>
              <div className="h-3 bg-border rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Data</h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  /**
   * Helper: normalize mileage union -> number
   * Trainset.mileage is number | { totalMileageKM: number; ... }
   */
  const mileageValue = (m: Trainset["mileage"]): number => {
    if (typeof m === "number") return Number.isFinite(m) ? m : 0
    if (m && typeof (m as any).totalMileageKM === "number") return (m as any).totalMileageKM
    return 0
  }

  // Calculate KPIs - using trainsets state instead of TRAINSETS constant
  const totalTrainsets = trainsets.length
  const activeTrainsets = trainsets.filter((t) => t.status === "Active").length
  const maintenanceTrainsets = trainsets.filter((t) => t.status === "Maintenance").length
  const availabilityRate = totalTrainsets > 0 ? Math.round((activeTrainsets / totalTrainsets) * 100) : 0

  // Fitness expiring soon
  const fitnessExpiringSoon = trainsets.filter((t) => {
    const days = daysUntil(t.fitness_certificate.expiry_date)
    return days <= 30 && days > 0
  }).length

  // Average mileage (use normalized numeric value)
  const avgMileage =
    totalTrainsets > 0
      ? Math.round(
          trainsets.reduce((sum, t) => {
            return sum + mileageValue(t.mileage)
          }, 0) / totalTrainsets,
        )
      : 0

  // Open job cards
  const totalOpenJobs = trainsets.reduce((sum, t) => sum + t.job_cards.filter((j) => j.status === "open").length, 0)

  // Mock sparkline data
  const availabilityTrend = [92, 89, 94, 91, 95, 93, 96, 94, 97, 95, 98, availabilityRate]
  const mileageTrend = [42000, 42500, 43000, 43200, 43800, 44100, 44500, 44800, 45200, 45600, 46000, avgMileage]
  const maintenanceTrend = [3, 2, 4, 3, 2, 3, 4, 2, 3, 2, 3, maintenanceTrainsets]

  // Top recommendations (highest priority scores)
  const topRecommendations = trainsets
    .filter((t) => t.status === "Active" || t.status === "Standby")
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 3)
    .map((trainset) => ({
      trainset,
      reason: getRecommendationReason(trainset, mileageValue),
      confidence: trainset.availability_confidence ?? trainset.priority_score,
    }))

  // Earliest fitness expiry (next 5)
  const upcomingFitness = trainsets
    .map((t) => ({
      ...t,
      daysUntilExpiry: daysUntil(t.fitness_certificate.expiry_date),
    }))
    .filter((t) => t.daysUntilExpiry > 0)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiTile
          title="Fleet Availability"
          value={`${availabilityRate}%`}
          subtitle={`${activeTrainsets}/${totalTrainsets} active`}
          progress={availabilityRate}
          sparklineData={availabilityTrend}
          trend="up"
        />

        <KpiTile
          title="Average Mileage"
          value={`${avgMileage.toLocaleString()}`}
          subtitle="km per trainset"
          sparklineData={mileageTrend.map((m) => m / 1000)}
          trend="neutral"
        />

        <KpiTile
          title="In Maintenance"
          value={maintenanceTrainsets}
          subtitle={`${totalTrainsets > 0 ? Math.round((maintenanceTrainsets / totalTrainsets) * 100) : 0}% of fleet`}
          progress={totalTrainsets > 0 ? Math.round((maintenanceTrainsets / totalTrainsets) * 100) : 0}
          sparklineData={maintenanceTrend}
          trend="down"
        />

        <KpiTile
          title="Open Job Cards"
          value={totalOpenJobs}
          subtitle={`${fitnessExpiringSoon} fitness expiring`}
          trend={totalOpenJobs > 10 ? "up" : "neutral"}
        />
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendations Column */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-text mb-4 text-balance">Recommended for Service</h2>
            <div className="space-y-4">
              {topRecommendations.length > 0 ? (
                topRecommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.trainset.id}
                    trainset={rec.trainset}
                    reason={rec.reason}
                    confidence={rec.confidence}
                  />
                ))
              ) : (
                <div className="bg-surface border border-border rounded-xl p-6 text-center">
                  <p className="text-muted">No recommendations available</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Fitness Renewals */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4 text-balance">Upcoming Fitness Renewals</h2>
            <div className="bg-surface border border-border rounded-xl shadow-md overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="divide-y divide-border">
                {upcomingFitness.length > 0 ? (
                  upcomingFitness.map((trainset) => (
                    <div
                      key={trainset.id}
                      className="p-4 flex items-center justify-between hover:bg-hover transition-colors"
                    >
                      <div>
                        <p className="font-medium text-text">{trainset.id}</p>
                        <p className="text-sm text-muted">{trainset.stabling_position}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${
                            trainset.daysUntilExpiry < 7 ? "text-red-600 dark:text-red-400" : "text-text"
                          }`}
                        >
                          {trainset.daysUntilExpiry} days
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(trainset.fitness_certificate.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted">No upcoming fitness renewals</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Animated Train Hero */}
        <div className="bg-surface border border-border rounded-xl shadow-md p-6 flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-semibold text-text mb-4 text-balance text-center">Fleet Status</h3>

          <Suspense fallback={<div className="w-48 h-20 bg-border rounded-lg animate-pulse" />}>
            <AnimatedTrain />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-2xl font-bold text-text">{activeTrainsets}</p>
            <p className="text-sm text-muted">Active Trainsets</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="font-medium text-text">{trainsets.filter((t) => t.status === "Standby").length}</p>
              <p className="text-muted">Standby</p>
            </div>
            <div>
              <p className="font-medium text-text">{maintenanceTrainsets}</p>
              <p className="text-muted">Maintenance</p>
            </div>
            <div>
              <p className="font-medium text-text">{trainsets.filter((t) => t.status === "OutOfService").length}</p>
              <p className="text-muted">Out of Service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * getRecommendationReason
 * - uses a mileage extractor passed in so it's easy to test/override
 */
function getRecommendationReason(trainset: Trainset, mileageFn: (m: Trainset["mileage"]) => number): string {
  const openJobs = trainset.job_cards.filter((j) => j.status === "open").length
  const fitnessExpiry = daysUntil(trainset.fitness_certificate.expiry_date)
  const miles = mileageFn(trainset.mileage)

  if (fitnessExpiry < 7) return "Fitness certificate expiring soon"
  if (openJobs === 0) return "No pending maintenance, ready for service"
  if (openJobs === 1) return "1 minor job card pending"
  if (miles < 40000) return "Low mileage, optimal for service"
  return "Good overall condition"
}
