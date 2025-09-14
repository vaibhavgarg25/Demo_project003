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
  // Filter out excluded statuses
  const eligibleTrainsets = trainsets.filter((trainset) => !params.excludeStatuses.includes(trainset.status))

  // Score each trainset
  const scoredResults = eligibleTrainsets.map((trainset) => {
    let score = 100 // Base score
    let confidence = 100
    const reasons: string[] = []

    // Fitness certificate scoring
    const fitnessExpiry = daysUntil(trainset.fitness_certificate.expiry_date)
    if (fitnessExpiry < 0) {
      score -= 50
      confidence -= 40
      reasons.push("Fitness certificate expired")
    } else if (fitnessExpiry < params.minFitnessDays) {
      score -= 40
      confidence -= 30
      reasons.push(`Fitness expires in ${fitnessExpiry} days`)
    } else if (fitnessExpiry > 180) {
      score += 5
      reasons.push("Long-term fitness validity")
    }

    // Job cards scoring
    const openJobCards = trainset.job_cards.filter((j) => j.status === "open").length
    if (openJobCards === 0) {
      score += 10
      confidence += 5
      reasons.push("No pending maintenance")
    } else {
      score -= openJobCards * 10
      confidence -= openJobCards * 8
      reasons.push(`${openJobCards} open job card${openJobCards > 1 ? "s" : ""}`)
    }

    // Mileage scoring
    const avgMileage = trainsets.reduce((sum, t) => sum + t.mileage, 0) / trainsets.length
    const mileageRatio = trainset.mileage / avgMileage

    if (params.prioritizeHighMileage) {
      if (mileageRatio > 1.2) {
        score += 15
        reasons.push("High mileage priority")
      } else if (mileageRatio < 0.8) {
        score -= 10
        reasons.push("Low mileage")
      }
    } else {
      if (mileageRatio > 1.3) {
        score -= 15
        confidence -= 10
        reasons.push("Very high mileage")
      } else if (mileageRatio < 0.9) {
        score += 10
        reasons.push("Low mileage, well-maintained")
      }
    }

    // Cleaning schedule requirement
    if (params.requireCleaningSlots) {
      if (trainset.cleaning_schedule === "Daily") {
        score += 5
        reasons.push("Daily cleaning schedule")
      } else if (trainset.cleaning_schedule === "None") {
        score -= 20
        confidence -= 15
        reasons.push("No cleaning schedule")
      }
    }

    // Branding status
    if (trainset.branding_status === "Complete") {
      score += 5
      reasons.push("Branding complete")
    } else if (trainset.branding_status === "Expired") {
      score -= 15
      confidence -= 10
      reasons.push("Branding expired")
    }

    // Status-specific adjustments
    switch (trainset.status) {
      case "Active":
        score += 10
        confidence += 5
        reasons.push("Currently active")
        break
      case "Standby":
        score += 5
        reasons.push("Ready for activation")
        break
      case "Maintenance":
        score -= 30
        confidence -= 25
        reasons.push("Under maintenance")
        break
      case "OutOfService":
        score -= 50
        confidence -= 40
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

  // Select top trainsets up to maxTrains limit
  let selectedCount = 0
  sortedResults.forEach((result) => {
    if (selectedCount < params.maxTrains && result.score >= 50) {
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
