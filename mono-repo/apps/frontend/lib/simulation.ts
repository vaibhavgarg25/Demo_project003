import type { Trainset } from "./mock-data"

export interface SimulationParams {
  availableTrainsDelta: number // Change in available trains (-5 to +5)
  maintenanceDelayDays: number // Additional maintenance delay (0 to 30 days)
  fitnessRenewalRate: number // Percentage of fitness renewals completed (0 to 100)
  newTrainsetCount: number // Number of new trainsets added (0 to 5)
}

export interface SimulationResult {
  before: {
    fleetAvailability: number
    onTimePerformance: number
    maintenanceBacklog: number
    averageMileage: number
  }
  after: {
    fleetAvailability: number
    onTimePerformance: number
    maintenanceBacklog: number
    averageMileage: number
  }
  impact: {
    availabilityChange: number
    performanceChange: number
    backlogChange: number
    mileageChange: number
  }
}

export function simulate(trainsets: Trainset[], params: SimulationParams): SimulationResult {
  // Calculate baseline metrics
  const totalTrainsets = trainsets.length
  const activeTrainsets = trainsets.filter((t) => t.status === "Active").length
  const maintenanceTrainsets = trainsets.filter((t) => t.status === "Maintenance").length
  const outOfServiceTrainsets = trainsets.filter((t) => t.status === "OutOfService").length

  const baselineAvailability = (activeTrainsets / totalTrainsets) * 100
  const baselinePerformance = Math.max(60, 95 - maintenanceTrainsets * 2 - outOfServiceTrainsets * 5)
  const baselineBacklog = trainsets.reduce((sum, t) => sum + t.job_cards.filter((j) => j.status === "open").length, 0)
  const baselineAvgMileage = trainsets.reduce((sum, t) => sum + t.mileage, 0) / totalTrainsets

  // Simulate changes
  let newActiveCount = activeTrainsets + params.availableTrainsDelta
  let newMaintenanceCount = maintenanceTrainsets
  let newOutOfServiceCount = outOfServiceTrainsets
  const newTotalCount = totalTrainsets + params.newTrainsetCount

  // Apply maintenance delay impact
  if (params.maintenanceDelayDays > 0) {
    const delayImpact = Math.floor(params.maintenanceDelayDays / 7) // 1 additional maintenance per week of delay
    newMaintenanceCount += delayImpact
    newActiveCount = Math.max(0, newActiveCount - delayImpact)
  }

  // Apply fitness renewal rate impact
  const fitnessImpact = (100 - params.fitnessRenewalRate) / 100
  const fitnessAffectedTrains = Math.floor(outOfServiceTrainsets * fitnessImpact)
  if (params.fitnessRenewalRate > 50) {
    // Good renewal rate - move some out-of-service back to active
    const recoveredTrains = Math.floor((outOfServiceTrainsets * (params.fitnessRenewalRate - 50)) / 100)
    newOutOfServiceCount = Math.max(0, newOutOfServiceCount - recoveredTrains)
    newActiveCount += recoveredTrains
  }

  // Add new trainsets (assume they start as active)
  newActiveCount += params.newTrainsetCount

  // Ensure counts don't exceed logical limits
  newActiveCount = Math.min(newActiveCount, newTotalCount)
  newMaintenanceCount = Math.min(newMaintenanceCount, newTotalCount - newActiveCount)
  newOutOfServiceCount = Math.max(0, newTotalCount - newActiveCount - newMaintenanceCount)

  // Calculate new metrics
  const newAvailability = (newActiveCount / newTotalCount) * 100
  const newPerformance = Math.max(60, 95 - newMaintenanceCount * 2 - newOutOfServiceCount * 5)

  // Backlog changes based on maintenance delays and new trainsets
  let newBacklog = baselineBacklog
  newBacklog += params.maintenanceDelayDays * 0.5 // More delay = more backlog
  newBacklog -= params.newTrainsetCount * 2 // New trainsets reduce pressure
  newBacklog = Math.max(0, newBacklog)

  // Average mileage changes
  let newAvgMileage = baselineAvgMileage
  if (params.newTrainsetCount > 0) {
    // New trainsets have low mileage (assume 5000 km average)
    const totalMileage = baselineAvgMileage * totalTrainsets + params.newTrainsetCount * 5000
    newAvgMileage = totalMileage / newTotalCount
  }

  return {
    before: {
      fleetAvailability: Math.round(baselineAvailability),
      onTimePerformance: Math.round(baselinePerformance),
      maintenanceBacklog: Math.round(baselineBacklog),
      averageMileage: Math.round(baselineAvgMileage),
    },
    after: {
      fleetAvailability: Math.round(newAvailability),
      onTimePerformance: Math.round(newPerformance),
      maintenanceBacklog: Math.round(newBacklog),
      averageMileage: Math.round(newAvgMileage),
    },
    impact: {
      availabilityChange: Math.round(newAvailability - baselineAvailability),
      performanceChange: Math.round(newPerformance - baselinePerformance),
      backlogChange: Math.round(newBacklog - baselineBacklog),
      mileageChange: Math.round(newAvgMileage - baselineAvgMileage),
    },
  }
}
