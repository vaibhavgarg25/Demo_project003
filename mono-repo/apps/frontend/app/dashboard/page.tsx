"use client"

import { Suspense, useEffect, useState } from "react"
import { KpiTile } from "@/components/KpiTile"
import { RecommendationCard } from "@/components/RecommendationCard"
import { SmoothBWTrain } from "@/components/AnimatedTrain"
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
    if (m && typeof (m as any).mileageSinceLastServiceKM === "number") return (m as any).mileageSinceLastServiceKM
    return 0
  }

  // Calculate KPIs based on actual operational status from backend
  const totalTrainsets = trainsets.length
  
  // Use actual operational status from backend operations data
  const inServiceTrains = trainsets.filter((t) => 
    t.operations?.operationalStatus?.toLowerCase() === "in_service" || 
    t.status === "Active"
  ).length
  
  const maintenanceTrainsets = trainsets.filter((t) => 
    t.operations?.operationalStatus?.toLowerCase() === "under_maintenance" || 
    t.status === "Maintenance"
  ).length
  
  const standbyTrainsets = trainsets.filter((t) => 
    t.operations?.operationalStatus?.toLowerCase() === "standby" || 
    t.status === "Standby"
  ).length
  
  // Calculate actual availability rate (In-Service trains / Total trains)
  const availabilityRate = totalTrainsets > 0 ? Math.round((inServiceTrains / totalTrainsets) * 100) : 0

  // Calculate fitness expiring soon based on actual expiry dates
  const fitnessExpiringSoon = trainsets.filter((t) => {
    if (!t.fitness?.rollingStockFitnessExpiryDate) return false
    const days = daysUntil(t.fitness.rollingStockFitnessExpiryDate)
    return days <= 30 && days > 0
  }).length

  // Calculate average total mileage from actual mileage data
  const avgMileage = totalTrainsets > 0
    ? Math.round(
        trainsets.reduce((sum, t) => {
          const totalMileage = t.mileage?.totalMileageKM || 0
          return sum + totalMileage
        }, 0) / totalTrainsets
      )
    : 0
    
  // Count actual open job cards from backend data
  const totalOpenJobs = trainsets.reduce((sum, t) => {
    return sum + (t.jobCardStatus?.openJobCards || 0)
  }, 0)

  // Generate realistic trend data based on current actual values
  const generateTrend = (currentValue: number, variance: number = 5) => {
    const trend = []
    for (let i = 11; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * variance
      trend.push(Math.max(0, currentValue + variation - (i * 0.5)))
    }
    trend[trend.length - 1] = currentValue // Ensure last value is current
    return trend
  }
  
  const availabilityTrend = generateTrend(availabilityRate, 8)
  const mileageTrend = generateTrend(avgMileage, 2000).map(v => Math.round(v))
  const maintenanceTrend = generateTrend(maintenanceTrainsets, 2).map(v => Math.round(Math.max(0, v)))

  // Top 13 trains based on actual health scores and fitness status
  const getHealthScore = (trainset: Trainset): number => {
    let score = 0
    
    // Fitness status scoring (40 points total)
    if (trainset.fitness?.rollingStockFitnessStatus) score += 15
    if (trainset.fitness?.signallingFitnessStatus) score += 15
    if (trainset.fitness?.telecomFitnessStatus) score += 10
    
    // Job card status (25 points)
    const openJobs = trainset.jobCardStatus?.openJobCards || 0
    if (openJobs === 0) score += 25
    else if (openJobs <= 2) score += 15
    else if (openJobs <= 5) score += 5
    
    // Mileage condition (20 points)
    const mileageKM = trainset.mileage?.totalMileageKM || 0
    if (mileageKM < 50000) score += 20
    else if (mileageKM < 100000) score += 15
    else if (mileageKM < 200000) score += 10
    else if (mileageKM < 300000) score += 5
    
    // Wear percentage (15 points)
    const brakeWear = trainset.mileage?.brakepadWearPercent || 0
    const hvacWear = trainset.mileage?.hvacWearPercent || 0
    const avgWear = (brakeWear + hvacWear) / 2
    if (avgWear < 25) score += 15
    else if (avgWear < 50) score += 10
    else if (avgWear < 75) score += 5
    
    return Math.min(100, score)
  }
  
  // Get top 13 trains sorted by health score (descending)
  const topTrains = trainsets
    .map((trainset) => ({
      trainset,
      healthScore: getHealthScore(trainset),
      reason: getRecommendationReason(trainset, mileageValue),
    }))
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 13)
    
  // Top 3 recommendations for display
  const topRecommendations = topTrains
    .slice(0, 3)
    .map((item) => ({
      trainset: item.trainset,
      reason: item.reason,
      confidence: item.healthScore,
    })) 
  // Earliest fitness expiry based on actual rolling stock fitness dates
  const upcomingFitness = trainsets
    .map((t) => ({
      ...t,
      daysUntilExpiry: t.fitness?.rollingStockFitnessExpiryDate 
        ? daysUntil(t.fitness.rollingStockFitnessExpiryDate)
        : -1,
      fitnessExpiryDate: t.fitness?.rollingStockFitnessExpiryDate || "",
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
          subtitle={`${inServiceTrains}/${totalTrainsets} in service`}
          progress={availabilityRate}
          sparklineData={availabilityTrend}
          trend={availabilityRate >= 85 ? "up" : availabilityRate >= 75 ? "neutral" : "down"}
        />

        <KpiTile
          title="Average Mileage"
          value={`${avgMileage.toLocaleString()}`}
          subtitle="km per trainset"
          sparklineData={mileageTrend.map((m) => m / 1000)}
          trend={avgMileage < 200000 ? "up" : avgMileage < 350000 ? "neutral" : "down"}
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
        {/* Top 13 Trains and Recommendations Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 13 Trains */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4 text-balance">Top 13 Trains by Health Score</h2>
            <div className="bg-surface border border-border rounded-xl shadow-md overflow-hidden">
              <div className="divide-y divide-border">
                {topTrains.length > 0 ? (
                  topTrains.map((train, index) => (
                    <div
                      key={train.trainset.trainID}
                      className="p-4 flex items-center justify-between hover:bg-hover transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-text">{train.trainset.trainname}</p>
                          <p className="text-sm text-muted">Train {train.trainset.trainID} • Bay {train.trainset.stabling?.bayPositionID || train.trainset.stabling_position || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-medium text-sm ${
                            train.healthScore >= 80 ? 'text-green-600 dark:text-green-400' : 
                            train.healthScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {train.healthScore}% Health
                          </p>
                          <p className="text-xs text-muted">
                            {train.trainset.operations?.operationalStatus || train.trainset.status}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          train.healthScore >= 80 ? 'bg-green-500' : 
                          train.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted">No train data available</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recommended for Service */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4 text-balance">Recommended for Service</h2>
            <div className="space-y-4">
              {topRecommendations.length > 0 ? (
                topRecommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.trainset.trainID}
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
                      key={trainset.trainID}
                      className="p-4 flex items-center justify-between hover:bg-hover transition-colors"
                    >
                      <div>
                        <p className="font-medium text-text">{trainset.trainname}</p>
                        <p className="text-sm text-muted">Bay Position: {trainset.stabling?.bayPositionID || trainset.stabling_position || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${trainset.daysUntilExpiry < 7 ? "text-red-600 dark:text-red-400" : "text-text"
                            }`}
                        >
                          {trainset.daysUntilExpiry} days
                        </p>
                        <p className="text-xs text-muted">
                          {trainset.fitnessExpiryDate ? new Date(trainset.fitnessExpiryDate).toLocaleDateString() : 'N/A'}
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
            <SmoothBWTrain />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-2xl font-bold text-text">{inServiceTrains}</p>
            <p className="text-sm text-muted">In Service</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="font-medium text-text">{standbyTrainsets}</p>
              <p className="text-muted">Standby</p>
            </div>
            <div>
              <p className="font-medium text-text">{maintenanceTrainsets}</p>
              <p className="text-muted">Maintenance</p>
            </div>
            <div>
              <p className="font-medium text-text">{totalTrainsets - inServiceTrains - standbyTrainsets - maintenanceTrainsets}</p>
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
 * - uses actual backend data for better recommendations
 */
function getRecommendationReason(trainset: Trainset, mileageFn: (m: Trainset["mileage"]) => number): string {
  const openJobs = trainset.jobCardStatus?.openJobCards || 0
  const operationalStatus = trainset.operations?.operationalStatus?.toLowerCase() || trainset.status.toLowerCase()
  const totalMileage = trainset.mileage?.totalMileageKM || 0
  const brakeWear = trainset.mileage?.brakepadWearPercent || 0
  const hvacWear = trainset.mileage?.hvacWearPercent || 0
  
  // Check fitness expiry from actual backend data
  const rollingStockExpiry = trainset.fitness?.rollingStockFitnessExpiryDate 
    ? daysUntil(trainset.fitness.rollingStockFitnessExpiryDate) 
    : -1
  const signallingExpiry = trainset.fitness?.signallingFitnessExpiryDate 
    ? daysUntil(trainset.fitness.signallingFitnessExpiryDate) 
    : -1
  const telecomExpiry = trainset.fitness?.telecomFitnessExpiryDate 
    ? daysUntil(trainset.fitness.telecomFitnessExpiryDate) 
    : -1
  
  const minExpiry = Math.min(rollingStockExpiry, signallingExpiry, telecomExpiry)
  
  // Priority-based recommendations
  if (minExpiry > 0 && minExpiry < 7) return "Fitness certificate expiring soon"
  if (operationalStatus === "in_service" && openJobs === 0) return "Currently in service, no pending maintenance"
  if (openJobs === 0 && operationalStatus !== "under_maintenance") return "No pending maintenance, ready for service"
  if (openJobs === 1) return "1 minor job card pending"
  if (totalMileage < 100000) return "Low mileage, optimal for service"
  if (brakeWear < 30 && hvacWear < 30) return "Low wear condition, excellent for service"
  if (operationalStatus === "standby") return "On standby, ready for deployment"
  return "Good overall condition"
}
