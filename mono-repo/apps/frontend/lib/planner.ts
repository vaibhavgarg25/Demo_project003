import type { Trainset } from "./mock-data"
import { daysUntil, clamp } from "./utils"

export interface PlannerParams {
  maxTrains: number
  requireCleaningSlots: boolean
  excludeStatuses: string[]
  prioritizeHighMileage: boolean
  minFitnessDays: number
}

export interface PlannerResult {
  trainset: Trainset
  score: number
  confidence: number
  reason: string
  selected: boolean
}

export interface PlannerRun {
  id: string
  timestamp: string
  params: PlannerParams
  results: PlannerResult[]
  summary: {
    totalSelected: number
    averageScore: number
    averageConfidence: number
  }
}

export function generatePlan(trainsets: Trainset[], params: PlannerParams): PlannerResult[] {
  // Filter out excluded statuses - check both legacy status and operational status
  const eligibleTrainsets = trainsets.filter((trainset) => {
    const operationalStatus = trainset.operations?.operationalStatus || trainset.status
    return !params.excludeStatuses.includes(trainset.status) && 
           !params.excludeStatuses.includes(operationalStatus)
  })

  // Score each trainset using actual backend data
  const scoredResults = eligibleTrainsets.map((trainset) => {
    let score = 100 // Base score
    let confidence = 100
    const reasons: string[] = []

    // Fitness certificate scoring using actual fitness data
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
    
    if (minExpiry < 0) {
      score -= 50
      confidence -= 40
      reasons.push("Fitness certificate expired")
    } else if (minExpiry < params.minFitnessDays) {
      score -= 40
      confidence -= 30
      reasons.push(`Fitness expires in ${minExpiry} days`)
    } else if (minExpiry > 180) {
      score += 5
      reasons.push("Long-term fitness validity")
    }

    // Job cards scoring using actual backend data
    const openJobCards = trainset.jobCardStatus?.openJobCards || 0
    if (openJobCards === 0) {
      score += 15
      confidence += 10
      reasons.push("No pending maintenance")
    } else {
      score -= openJobCards * 8
      confidence -= openJobCards * 6
      reasons.push(`${openJobCards} open job card${openJobCards > 1 ? "s" : ""}`) 
    }

    // Mileage scoring using actual mileage data
    const trainMileage = trainset.mileage?.totalMileageKM || 0
    const avgMileage = eligibleTrainsets.reduce((sum, t) => sum + (t.mileage?.totalMileageKM || 0), 0) / eligibleTrainsets.length
    const mileageRatio = avgMileage > 0 ? trainMileage / avgMileage : 1

    if (params.prioritizeHighMileage) {
      if (mileageRatio > 1.2) {
        score += 15
        reasons.push("High mileage priority")
      } else if (mileageRatio < 0.8) {
        score -= 10
        reasons.push("Low mileage")
      }
    } else {
      if (mileageRatio > 1.5) {
        score -= 20
        confidence -= 15
        reasons.push("Very high mileage")
      } else if (mileageRatio < 0.9) {
        score += 10
        reasons.push("Low mileage, well-maintained")
      }
    }

    // Wear condition scoring
    const brakeWear = trainset.mileage?.brakepadWearPercent || 0
    const hvacWear = trainset.mileage?.hvacWearPercent || 0
    const avgWear = (brakeWear + hvacWear) / 2
    
    if (avgWear < 25) {
      score += 10
      reasons.push("Low wear condition")
    } else if (avgWear > 75) {
      score -= 20
      confidence -= 15
      reasons.push("High wear condition")
    }

    // Cleaning schedule requirement using actual cleaning data
    if (params.requireCleaningSlots) {
      if (trainset.cleaning?.cleaningRequired) {
        score += 5
        reasons.push("Cleaning scheduled")
      } else {
        score -= 10
        confidence -= 5
        reasons.push("No cleaning scheduled")
      }
    }

    // Branding status using actual branding data
    if (trainset.branding?.brandingActive) {
      score += 5
      reasons.push("Active branding campaign")
    }

    // Status-specific adjustments using operational status
    const operationalStatus = trainset.operations?.operationalStatus?.toLowerCase() || trainset.status.toLowerCase()
    switch (operationalStatus) {
      case "active":
      case "in_service":
        score += 15
        confidence += 10
        reasons.push("Currently in service")
        break
      case "standby":
        score += 8
        confidence += 5
        reasons.push("Ready for activation")
        break
      case "maintenance":
      case "under_maintenance":
        score -= 35
        confidence -= 30
        reasons.push("Under maintenance")
        break
      case "outofservice":
      case "out_of_service":
        score -= 60
        confidence -= 50
        reasons.push("Out of service")
        break
    }

    // Normalize scores
    score = clamp(score, 0, 100)
    confidence = clamp(confidence, 0, 100)

    // Generate primary reason
    const primaryReason = reasons.length > 0 ? reasons[0] : "Standard evaluation"

    return {
      trainset,
      score,
      confidence,
      reason: primaryReason,
      selected: false,
    }
  })

  // Sort by score (descending) and select top trainsets
  const sortedResults = scoredResults.sort((a, b) => b.score - a.score)

  // Select top trainsets up to maxTrains limit with minimum threshold
  let selectedCount = 0
  sortedResults.forEach((result) => {
    if (selectedCount < params.maxTrains && result.score >= 40) {
      result.selected = true
      selectedCount++
    }
  })

  return sortedResults
}

export function savePlannerRun(params: PlannerParams, results: PlannerResult[]): void {
  const selectedResults = results.filter((r) => r.selected)
  const run: PlannerRun = {
    id: `plan-${Date.now()}`,
    timestamp: new Date().toISOString(),
    params,
    results,
    summary: {
      totalSelected: selectedResults.length,
      averageScore:
        selectedResults.length > 0
          ? Math.round(selectedResults.reduce((sum, r) => sum + r.score, 0) / selectedResults.length)
          : 0,
      averageConfidence:
        selectedResults.length > 0
          ? Math.round(selectedResults.reduce((sum, r) => sum + r.confidence, 0) / selectedResults.length)
          : 0,
    },
  }

  // Save to localStorage
  const existingRuns = getPlannerHistory()
  const updatedRuns = [run, ...existingRuns].slice(0, 50) // Keep last 50 runs
  localStorage.setItem("planner-history", JSON.stringify(updatedRuns))
}

export function getPlannerHistory(): PlannerRun[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem("planner-history")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function getPlannerRun(id: string): PlannerRun | undefined {
  const history = getPlannerHistory()
  return history.find((run) => run.id === id)
}
