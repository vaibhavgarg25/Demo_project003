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
  function getHealthScore(trainset: any): number {
  // helper: normalize status (boolean/number/string) -> 0..1 or NaN if missing
  const normalizeStatus = (v: any): number => {
    if (v == null) return NaN
    if (typeof v === "boolean") return v ? 1 : 0
    if (typeof v === "number") return Math.max(0, Math.min(1, v / 100))
    if (typeof v === "string") {
      const s = v.trim().toLowerCase()
      if (["ok", "good", "pass", "healthy", "nominal"].includes(s)) return 1
      if (["warn", "degraded", "minor"].includes(s)) return 0.6
      if (["fail", "bad", "critical", "major"].includes(s)) return 0
      const n = parseFloat(s)
      if (!Number.isNaN(n)) return Math.max(0, Math.min(1, n / 100))
    }
    return NaN
  }

  // job score: fewer open jobs -> closer to 1
  const jobScoreFromOpen = (openJobs: number | undefined, maxCap = 8) => {
    if (openJobs == null) return NaN
    const capped = Math.max(0, openJobs)
    return 1 - Math.min(capped / maxCap, 1)
  }

  // mileage score: smooth decay, M50 ~ 120000km gives ~0.5
  const mileageScoreFromKM = (km: number | undefined, M50 = 120000, k = 1.2) => {
    if (km == null || Number.isNaN(km)) return NaN
    const x = Math.max(0, km)
    const val = 1 / (1 + Math.pow(x / M50, k))
    return Math.max(0, Math.min(1, val))
  }

  // wear: average of wear percents (lower is better)
  const wearScoreFromAvg = (avgWear: number | undefined) => {
    if (avgWear == null || Number.isNaN(avgWear)) return NaN
    const pct = Math.max(0, Math.min(100, avgWear))
    return 1 - pct / 100
  }

  // extract inputs
  const rs = normalizeStatus(trainset?.fitness?.rollingStockFitnessStatus)
  const ss = normalizeStatus(trainset?.fitness?.signallingFitnessStatus)
  const ts = normalizeStatus(trainset?.fitness?.telecomFitnessStatus)
  const openJobs = trainset?.jobCardStatus?.openJobCards
  const mileageKM = trainset?.mileage?.totalMileageKM
  const brakeWear = trainset?.mileage?.brakepadWearPercent
  const hvacWear = trainset?.mileage?.hvacWearPercent

  // fitness: average of available fitness statuses
  const fitnessValues = [rs, ss, ts].filter((v) => Number.isFinite(v))
  const fitnessScore = fitnessValues.length > 0 ? fitnessValues.reduce((a, b) => a + b, 0) / fitnessValues.length : NaN

  const jobScore = jobScoreFromOpen(openJobs)
  const mileageScore = mileageScoreFromKM(mileageKM)
  const wearInputs = [brakeWear, hvacWear].filter((v) => v != null).map(Number)
  const avgWear = wearInputs.length > 0 ? wearInputs.reduce((a, b) => a + b, 0) / wearInputs.length : NaN
  const wearScore = wearScoreFromAvg(avgWear)

  // combine with weights (they sum to 1)
  let wFitness = 0.30, wJob = 0.20, wMileage = 0.25, wWear = 0.25
  const components = [
    { val: fitnessScore, weight: wFitness },
    { val: jobScore, weight: wJob },
    { val: mileageScore, weight: wMileage },
    { val: wearScore, weight: wWear },
  ]

  const present = components.filter((c) => Number.isFinite(c.val))
  if (present.length === 0) return 50 // no data -> neutral 50

  const presentWeightSum = present.reduce((s, c) => s + c.weight, 0)
  let rawWeighted = present.reduce((sum, c) => sum + (c.val * (c.weight / presentWeightSum)), 0)
  rawWeighted = Math.max(0, Math.min(1, rawWeighted))

  // sigmoid calibration for nicer distribution
  const sigmoid = (x: number, center = 0.5, slope = 6) => 1 / (1 + Math.exp(-slope * (x - center)))
  const calibrated = sigmoid(rawWeighted, 0.5, 6)

  // completeness factor: how many of 4 components present
  const completeness = present.length / components.length
  const scale = 0.6 + 0.4 * completeness // when completeness=1 => scale=1, when 0 => scale=0.6
  const finalNormalized = calibrated * scale + (1 - scale) * 0.5

  const confidence = Math.round(Math.max(0, Math.min(100, finalNormalized * 100)))
  return confidence
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
function getRecommendationReason(
  trainset: Trainset,
  mileageFn: (m: Trainset["mileage"]) => number
): string {
  // helpers
  const safeNum = (v: any, fallback = NaN) => {
    if (v == null) return fallback
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))

  // normalize textual status
  const normStatus = (s?: string) => (s ? s.toLowerCase().trim() : "")

  // input values
  const openJobs = safeNum(trainset.jobCardStatus?.openJobCards, 0)
  const operationalRaw = normStatus(trainset.operations?.operationalStatus || (trainset as any).status)
  const totalMileage = safeNum(mileageFn ? mileageFn(trainset.mileage) : trainset.mileage?.totalMileageKM, 0)
  const brakeWear = safeNum(trainset.mileage?.brakepadWearPercent, NaN)
  const hvacWear = safeNum(trainset.mileage?.hvacWearPercent, NaN)
  const avgWear = Number.isFinite(brakeWear) || Number.isFinite(hvacWear)
    ? (Number.isFinite(brakeWear) ? brakeWear : 0) + (Number.isFinite(hvacWear) ? hvacWear : 0)
    : NaN
  const wearCount = (Number.isFinite(brakeWear) ? 1 : 0) + (Number.isFinite(hvacWear) ? 1 : 0)
  const wearPercent = Number.isFinite(avgWear) && wearCount > 0 ? avgWear / wearCount : NaN

  // fitness expiry days (use daysUntil(date) from your codebase; if missing treat as Infinity)
  const rollingDays = trainset.fitness?.rollingStockFitnessExpiryDate ? daysUntil(trainset.fitness.rollingStockFitnessExpiryDate) : Infinity
  const signallingDays = trainset.fitness?.signallingFitnessExpiryDate ? daysUntil(trainset.fitness.signallingFitnessExpiryDate) : Infinity
  const telecomDays = trainset.fitness?.telecomFitnessExpiryDate ? daysUntil(trainset.fitness.telecomFitnessExpiryDate) : Infinity
  const fitnessDays = [rollingDays, signallingDays, telecomDays].filter((d) => Number.isFinite(d))
  const minExpiry = fitnessDays.length ? Math.min(...fitnessDays) : Infinity

  // component urgency scores (0..1 where 1 = most urgent / worst)
  // fitness urgency: expired -> 1, <7d -> 0.95, <30 -> 0.7, <90 -> 0.4, else 0.05
  let fitnessUrgency = 0.05
  if (!Number.isFinite(minExpiry)) fitnessUrgency = 0.05
  else if (minExpiry <= 0) fitnessUrgency = 1
  else if (minExpiry <= 7) fitnessUrgency = 0.95
  else if (minExpiry <= 30) fitnessUrgency = 0.7
  else if (minExpiry <= 90) fitnessUrgency = 0.4

  // job urgency: more open jobs => higher urgency
  // 0 -> 0, 1-2 -> 0.35, 3-5 -> 0.7, >5 -> 1
  let jobUrgency = 0
  if (openJobs === 0) jobUrgency = 0
  else if (openJobs <= 2) jobUrgency = 0.35
  else if (openJobs <= 5) jobUrgency = 0.7
  else jobUrgency = 1

  // wear urgency: wearPercent 0..100 mapped to 0..1 (higher wear => higher urgency)
  const wearUrgency = Number.isFinite(wearPercent) ? clamp(wearPercent / 100, 0, 1) : 0

  // mileage risk: higher mileage => higher risk. Use soft power mapping
  // below 50k => low risk; 50k-150k => medium; >250k => high
  const mileageRisk = clamp(Math.pow(totalMileage / 180000, 0.9), 0, 1) // tuned mapping

  // operational status modifiers
  const isInService = ["in_service", "running", "active"].includes(operationalRaw)
  const isStandby = ["standby", "idle"].includes(operationalRaw)
  const isUnderMaint = ["under_maintenance", "maintenance"].includes(operationalRaw)
  const isFault = ["fault", "degraded", "out_of_service"].includes(operationalRaw)

  // weights for final priority score (tweakable)
  const W = {
    fitness: 0.35,
    jobs: 0.25,
    wear: 0.2,
    mileage: 0.2,
  }

  // compute priority score (0..1) where closer to 1 means immediate attention recommended
  const priority =
    clamp(
      fitnessUrgency * W.fitness +
        jobUrgency * W.jobs +
        wearUrgency * W.wear +
        mileageRisk * W.mileage,
      0,
      1
    )

  // Build dynamic recommendation text with priority reasons
  // Highest-priority checks first (fitness expiry/expired)
  if (minExpiry <= 0) {
    return `Fitness certificate expired — ground train until recertified (expired ${Math.abs(Math.round(minExpiry))} day(s) ago).`
  }
  if (minExpiry > 0 && minExpiry <= 7) {
    return `Fitness certificate expiring in ${Math.round(minExpiry)} day(s) — schedule immediate inspection and recertification.`
  }

  // If operationally faulty or out_of_service, surface clearest action
  if (isFault) {
    return openJobs > 0
      ? `Train reported fault & ${openJobs} open job card(s) — prioritize troubleshooting and complete job cards before returning to service.`
      : `Train reported fault — halt service and run diagnostics; create job cards as needed.`
  }

  // Very high combined priority -> preventive or corrective maintenance
  if (priority >= 0.85) {
    // show contributing factors
    const reasons: string[] = []
    if (jobUrgency >= 0.7) reasons.push(`${openJobs} open job(s)`)
    if (fitnessUrgency >= 0.7) reasons.push(`fitness expiring soon`)
    if (wearUrgency >= 0.6) reasons.push(`high wear (${Number.isFinite(wearPercent) ? Math.round(wearPercent) + "%" : "N/A"})`)
    if (mileageRisk >= 0.6) reasons.push(`high mileage (${Math.round(totalMileage)} km)`)
    return `High priority maintenance recommended — ${reasons.join(", ")}. Schedule immediate inspection and corrective actions.`
  }

  // Medium priority cases
  if (priority >= 0.5) {
    const reasons: string[] = []
    if (jobUrgency > 0) reasons.push(`${openJobs} open job(s)`)
    if (wearUrgency >= 0.35) reasons.push(`moderate wear (${Number.isFinite(wearPercent) ? Math.round(wearPercent) + "%" : "N/A"})`)
    if (mileageRisk >= 0.35) reasons.push(`elevated mileage (${Math.round(totalMileage)} km)`)
    if (reasons.length)
      return `Medium priority — ${reasons.join(", ")}. Recommend scheduled maintenance within next 2–4 weeks.`
  }

  // Low priority but with helpful notes
  if (isInService && openJobs === 0 && (Number.isFinite(wearPercent) ? wearPercent < 30 : true) && mileageRisk < 0.35) {
    return "Good to run — currently in service with no pending maintenance. Continue regular monitoring."
  }

  // Standby or idle trains with no jobs
  if (isStandby && openJobs === 0) {
    return "On standby with no pending maintenance — ready for deployment when needed."
  }

  // Fallback: summary message including key metrics
  const pieces: string[] = []
  if (openJobs > 0) pieces.push(`${openJobs} open job(s)`)
  if (Number.isFinite(wearPercent)) pieces.push(`wear ${Math.round(wearPercent)}%`)
  if (totalMileage) pieces.push(`${Math.round(totalMileage)} km mileage`)
  if (pieces.length) {
    return `Good overall condition but note: ${pieces.join(", ")} — monitor and schedule routine checks as required.`
  }

  return "General status: Good — no immediate actions detected. Continue routine monitoring."
}

