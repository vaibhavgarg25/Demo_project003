// mockdata.ts
// Mock data based on actual backend response structure
import axios from "axios"

/**
 * Types matching the actual backend response structure
 */
type TrainRaw = {
  id?: string | number
  trainname?: string
  trainID?: string
  code?: string
  trainId?: string
  createdAt?: string
  created_at?: string
  created?: string
  updatedAt?: string
  updated_at?: string
  updated?: string
  status?: string
  stabling_position?: string
  current_date?: string
  // plus any other fields your API might return
  [k: string]: any
}

type SubResource = { [k: string]: any }

type MemorizedTrain = {
  id: string
  trainname: string
  trainID: string
  current_date: string
  createdAt: string
  updatedAt: string
  fitness: {
    rollingStockFitnessStatus: boolean
    rollingStockFitnessExpiryDate: string
    signallingFitnessStatus: boolean
    signallingFitnessExpiryDate: string
    telecomFitnessStatus: boolean
    telecomFitnessExpiryDate: string
    fitnessExpiryDate: string
    lastFitnessCheckDate: string
    trainId: string
  }
  jobCardStatus: {
    jobCardStatus: "open" | "close" | string
    openJobCards: number
    closedJobCards: number
    lastJobCardUpdate: string
    trainId: string
  }
  branding: {
    brandingActive: boolean
    brandCampaignID: string
    exposureHoursAccrued: number
    exposureHoursTarget: number
    exposureDailyQuota: number
    trainId: string
  }
  mileage: {
    totalMileageKM: number
    mileageSinceLastServiceKM: number
    mileageBalanceVariance: number
    brakepadWearPercent: number
    hvacWearPercent: number
    trainId: string
  }
  cleaning: {
    cleaningRequired: boolean
    cleaningSlotStatus: string
    bayOccupancyIDC: string
    cleaningCrewAssigned: number | null
    lastCleanedDate: string
    trainId: string
  }
  stabling: {
    bayPositionID: string | number
    shuntingMovesRequired: number
    stablingSequenceOrder: number
    trainId: string
  }
  operations: {
    operationalStatus: string
    reasonForStatus: string
    trainId: string
  }
}

/**
 * Export the MemorizedTrain type as Trainset for backward compatibility
 */
export type Trainset = MemorizedTrain & {
  // Legacy fields for backward compatibility
  code: string
  trainID: string
  current_date: string
  status: "Active" | "Standby" | "Maintenance" | "OutOfService"
  // Keep the full mileage object structure
  mileage: MemorizedTrain["mileage"]
  stabling_position: string
  fitness_certificate: {
    expiry_date: string
  }
  job_cards: Array<{
    id: string
    status: "open" | "closed"
    description: string
    created_at: string
  }>
  cleaning_schedule: string
  branding_status: string
  priority_score: number
  availability_confidence?: number
  maintenance_history: Array<{
    date: string
    duration_days: number
  }>
}

/**
 * Build memorized train object — types are permissive for inputs (Partial/SubResource)
 */
function buildMemorizedTrain({
  base = {},
  fitness = {},
  jobCard = {},
  branding = {},
  mileage = {},
  cleaning = {},
  stabling = {},
  operations = {},
}: {
  base?: Partial<TrainRaw>
  fitness?: SubResource
  jobCard?: SubResource
  branding?: SubResource
  mileage?: SubResource
  cleaning?: SubResource
  stabling?: SubResource
  operations?: SubResource
}): MemorizedTrain {
  const trainID =
    (base && (base.trainID as string)) ||
    (base && (base.code as string)) ||
    (base && String(base.id)) ||
    (base && (base.trainId as string)) ||
    ""

  return {
    id: String(base?.id || trainID),
    trainname: (base && (base.trainname as string)) || `Train-${trainID || String(base?.id) || ""}`,
    trainID: trainID,
    current_date: (base && (base.current_date as string)) || new Date().toISOString(),
    createdAt:
      (base && (base.createdAt as string)) ||
      (base && (base.created_at as string)) ||
      (base && (base.created as string)) ||
      "",
    updatedAt:
      (base && (base.updatedAt as string)) ||
      (base && (base.updated_at as string)) ||
      (base && (base.updated as string)) ||
      "",
    fitness: {
      rollingStockFitnessStatus:
        typeof fitness.rollingStockFitnessStatus === "boolean"
          ? fitness.rollingStockFitnessStatus
          : !!(base && base.status && (base.status as string).toLowerCase() === "active"),
      rollingStockFitnessExpiryDate: fitness.rollingStockFitnessExpiryDate || fitness.fitness_expiry_date || "",
      signallingFitnessStatus:
        typeof fitness.signallingFitnessStatus === "boolean" ? fitness.signallingFitnessStatus : true,
      signallingFitnessExpiryDate: fitness.signallingFitnessExpiryDate || fitness.signalling_expiry_date || "",
      telecomFitnessStatus: typeof fitness.telecomFitnessStatus === "boolean" ? fitness.telecomFitnessStatus : true,
      telecomFitnessExpiryDate: fitness.telecomFitnessExpiryDate || fitness.telecom_expiry_date || "",
      fitnessExpiryDate: fitness.fitnessExpiryDate || fitness.expiry_date || fitness.expiry || "",
      lastFitnessCheckDate: fitness.lastFitnessCheckDate || fitness.last_check_date || fitness.lastCheck || "",
      trainId: trainID,
    },
    jobCardStatus: {
      jobCardStatus:
        jobCard.jobCardStatus ||
        (typeof jobCard.openJobCards === "number" && jobCard.openJobCards > 0 ? "open" : "close") ||
        (base && (base as any).openJobCards && (base as any).openJobCards > 0 ? "open" : "close"),
      openJobCards: jobCard.openJobCards ?? jobCard.open_jobs ?? 0,
      closedJobCards: jobCard.closedJobCards ?? jobCard.closed_jobs ?? 0,
      lastJobCardUpdate: jobCard.lastJobCardUpdate || jobCard.last_update || "",
      trainId: trainID,
    },
    branding: {
      brandingActive:
        typeof branding.brandingActive === "boolean"
          ? branding.brandingActive
          : branding.branding_status?.toLowerCase?.() === "complete"
            ? true
            : !!branding.brandingActive,
      brandCampaignID: branding.brandCampaignID || branding.brandCampaignId || branding.campaignId || "",
      exposureHoursAccrued: branding.exposureHoursAccrued ?? branding.exposure_hours_accrued ?? 0,
      exposureHoursTarget: branding.exposureHoursTarget ?? branding.exposure_hours_target ?? 0,
      exposureDailyQuota: branding.exposureDailyQuota ?? branding.exposure_daily_quota ?? 0,
      trainId: trainID,
    },
    mileage: {
      totalMileageKM: mileage.totalMileageKM ?? mileage.mileage ?? mileage.total_mileage_km ?? 0,
      mileageSinceLastServiceKM: mileage.mileageSinceLastServiceKM ?? mileage.since_last_service ?? 0,
      mileageBalanceVariance: mileage.mileageBalanceVariance ?? 0,
      brakepadWearPercent: mileage.brakepadWearPercent ?? mileage.brake_wear_percent ?? 0,
      hvacWearPercent: mileage.hvacWearPercent ?? mileage.hvac_wear_percent ?? 0,
      trainId: trainID,
    },
    cleaning: {
      cleaningRequired:
        typeof cleaning.cleaningRequired === "boolean"
          ? cleaning.cleaningRequired
          : cleaning.cleaning_schedule
            ? cleaning.cleaning_schedule.toLowerCase() !== "none"
            : true,
      cleaningSlotStatus:
        cleaning.cleaningSlotStatus ||
        cleaning.cleaning_slot_status ||
        (cleaning.cleaning_schedule &&
        cleaning.cleaning_schedule.toLowerCase &&
        cleaning.cleaning_schedule.toLowerCase() !== "none"
          ? "booked"
          : "pending"),
      bayOccupancyIDC:
        cleaning.bayOccupancyIDC ||
        cleaning.bay_occupancy_idc ||
        (base && (base.stabling_position as string)) ||
        String(stabling.bayPositionID) ||
        "",
      cleaningCrewAssigned: cleaning.cleaningCrewAssigned ?? cleaning.crew_assigned ?? null,
      lastCleanedDate: cleaning.lastCleanedDate || cleaning.last_cleaned_date || "",
      trainId: trainID,
    },
    stabling: {
      bayPositionID:
        stabling.bayPositionID || stabling.bay_position_id || (base && (base.stabling_position as string)) || "",
      shuntingMovesRequired: stabling.shuntingMovesRequired ?? stabling.shunting_moves_required ?? 0,
      stablingSequenceOrder: stabling.stablingSequenceOrder ?? stabling.sequence_order ?? 0,
      trainId: trainID,
    },
    operations: {
      operationalStatus:
        operations.operationalStatus || operations.status || (base && (base.status as string)) || "Unknown",
      reasonForStatus: operations.reasonForStatus || operations.reason_for_status || "",
      trainId: trainID,
    },
  }
}

/**
 * Generic fetch helper
 */
async function fetchJson(url: string, token?: string): Promise<any> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await axios.get(url, { headers, timeout: 10_000 })
  return res.data
}

/**
 * Main parser
 */
export async function parseAllTrains(baseUrl: string, token?: string): Promise<MemorizedTrain[]> {
  if (!baseUrl) throw new Error("baseUrl is required (e.g. https://api.example.com)")
  const root = baseUrl.replace(/\/$/, "")

  // getTrains endpoint
  const trainsListRaw = await fetchJson(`${root}/api/train/getTrains`, token)

  // unwrap common wrappers if present
  const trainsArray: TrainRaw[] = Array.isArray(trainsListRaw)
    ? trainsListRaw
    : trainsListRaw?.data && Array.isArray(trainsListRaw.data)
      ? trainsListRaw.data
      : []

  // Transform the backend data using the actual structure
  const memorizedTrains = trainsArray.map((train) => {
    return buildMemorizedTrain({
      base: train,
      fitness: train.fitness || {},
      jobCard: train.jobCardStatus || {},
      branding: train.branding || {},
      mileage: train.mileage || {},
      cleaning: train.cleaning || {},
      stabling: train.stabling || {},
      operations: train.operations || {},
    })
  })

  return memorizedTrains
}

/**
 * Transform MemorizedTrain to legacy Trainset format
 */
function transformToLegacyFormat(train: MemorizedTrain): Trainset {
  // Map operational status to legacy status format
  const mapOperationalStatus = (status: string): "Active" | "Standby" | "Maintenance" | "OutOfService" => {
    switch (status.toLowerCase()) {
      case "in_service":
        return "Active"
      case "standby":
        return "Standby"
      case "under_maintenance":
        return "Maintenance"
      default:
        return "OutOfService"
    }
  }

  return {
    ...train,
    code: train.trainID,
    current_date: train.current_date,
    status: mapOperationalStatus(train.operations.operationalStatus),
    // Return the full mileage object
    mileage: train.mileage,
    stabling_position: String(train.stabling.bayPositionID ?? ""),
    fitness_certificate: {
      expiry_date: train.fitness.fitnessExpiryDate,
    },
    job_cards: [
      // Mock job cards based on jobCardStatus
      ...(train.jobCardStatus.openJobCards > 0
        ? Array.from({ length: train.jobCardStatus.openJobCards }, (_, i) => ({
            id: `JOB-${train.trainID}-${i + 1}`,
            status: "open" as const,
            description: `Maintenance job ${i + 1}`,
            created_at: train.jobCardStatus.lastJobCardUpdate || new Date().toISOString(),
          }))
        : []),
      ...(train.jobCardStatus.closedJobCards > 0
        ? Array.from({ length: train.jobCardStatus.closedJobCards }, (_, i) => ({
            id: `JOB-${train.trainID}-CLOSED-${i + 1}`,
            status: "closed" as const,
            description: `Completed job ${i + 1}`,
            created_at: train.jobCardStatus.lastJobCardUpdate || new Date().toISOString(),
          }))
        : []),
    ],
    cleaning_schedule: train.cleaning.cleaningRequired ? "Daily" : "None",
    branding_status: train.branding.brandingActive ? "Complete" : "Pending",
    priority_score: Math.round(
      (train.fitness.rollingStockFitnessStatus ? 30 : 0) +
        (train.jobCardStatus.openJobCards === 0 ? 30 : 0) +
        (train.branding.brandingActive ? 20 : 0) +
        (train.cleaning.cleaningRequired ? 20 : 0),
    ),
    availability_confidence: Math.round(
      (train.fitness.rollingStockFitnessStatus ? 25 : 0) +
        (train.fitness.signallingFitnessStatus ? 25 : 0) +
        (train.fitness.telecomFitnessStatus ? 25 : 0) +
        (train.jobCardStatus.openJobCards === 0 ? 25 : 0),
    ),
    maintenance_history: [
      // Mock maintenance history
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration_days: 3,
      },
      {
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        duration_days: 2,
      },
    ],
  }
}

/**
 * Create API client functions
 */
export async function fetchTrainsets(): Promise<Trainset[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:8000"
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    console.log("[v0] Fetching trainsets from:", `${baseUrl}/api/train/getTrains`)

    const response = await fetch(`${baseUrl}/api/train/getTrains`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Raw backend data:", data)

    // Transform backend data to match expected Trainset format
    const trains = Array.isArray(data) ? data : data.data || []
    const transformedTrains = trains.map(transformBackendDataToTrainset)

    console.log("[v0] Transformed trainsets:", transformedTrains)
    return transformedTrains
  } catch (error) {
    console.error("[v0] Failed to fetch trainsets from backend:", error)

    if (process.env.NODE_ENV === "development") {
      console.warn("[v0] Falling back to mock data in development mode")
    }

    // In production, return empty array to prevent crashes
    return []
  }
}

function transformBackendDataToTrainset(backendTrain: any): Trainset {
  console.log("[v0] Transforming backend train:", backendTrain)

  // Map operational status to legacy format
  const mapOperationalStatus = (status: string): "Active" | "Standby" | "Maintenance" | "OutOfService" => {
    switch (status?.toLowerCase()) {
      case "in_service":
        return "Active"
      case "standby":
        return "Standby"
      case "under_maintenance":
        return "Maintenance"
      default:
        return "OutOfService"
    }
  }

  const transformed = {
    id: String(backendTrain.id || backendTrain.trainID || ""),
    trainname: backendTrain.trainname || `Train-${backendTrain.id || backendTrain.trainID || ""}`,
    trainID: String(backendTrain.trainID || backendTrain.id || ""),
    code: String(backendTrain.code || backendTrain.trainID || backendTrain.id || ""),
    current_date: backendTrain.current_date || new Date().toISOString(),
    status: mapOperationalStatus(backendTrain.operations?.operationalStatus || backendTrain.status || ""),
    // Return the full mileage object structure
    mileage: {
      totalMileageKM: Number(backendTrain.mileage?.totalMileageKM || backendTrain.total_mileage_km || backendTrain.mileage || 0),
      mileageSinceLastServiceKM: Number(backendTrain.mileage?.mileageSinceLastServiceKM || backendTrain.mileage_since_last_service || 0),
      mileageBalanceVariance: Number(backendTrain.mileage?.mileageBalanceVariance || backendTrain.mileage_balance_variance || 0),
      brakepadWearPercent: Number(backendTrain.mileage?.brakepadWearPercent || backendTrain.brakepad_wear_percent || 0),
      hvacWearPercent: Number(backendTrain.mileage?.hvacWearPercent || backendTrain.hvac_wear_percent || 0),
      trainId: String(backendTrain.id || backendTrain.trainID || ""),
    },
    stabling_position: String(backendTrain.stabling?.bayPositionID || backendTrain.stabling_position || ""),
    createdAt: backendTrain.createdAt || backendTrain.created_at || "",
    updatedAt: backendTrain.updatedAt || backendTrain.updated_at || "",

    // Transform nested objects with proper defaults
    fitness: {
      rollingStockFitnessStatus: backendTrain.fitness?.rollingStockFitnessStatus ?? true,
      rollingStockFitnessExpiryDate: backendTrain.fitness?.rollingStockFitnessExpiryDate || "",
      signallingFitnessStatus: backendTrain.fitness?.signallingFitnessStatus ?? true,
      signallingFitnessExpiryDate: backendTrain.fitness?.signallingFitnessExpiryDate || "",
      telecomFitnessStatus: backendTrain.fitness?.telecomFitnessStatus ?? true,
      telecomFitnessExpiryDate: backendTrain.fitness?.telecomFitnessExpiryDate || "",
      fitnessExpiryDate: backendTrain.fitness?.rollingStockFitnessExpiryDate || backendTrain.fitness_expiry_date || "",
      lastFitnessCheckDate: backendTrain.fitness?.lastFitnessCheckDate || backendTrain.last_fitness_check || "",
      trainId: String(backendTrain.id || backendTrain.trainID || ""),
    },

    jobCardStatus: {
      jobCardStatus: backendTrain.jobCardStatus?.jobCardStatus || ((Number(backendTrain.jobCardStatus?.openJobCards) || 0) > 0 ? "open" : "close"),
      openJobCards: Number(backendTrain.jobCardStatus?.openJobCards) || 0,
      closedJobCards: Number(backendTrain.jobCardStatus?.closedJobCards) || 0,
      lastJobCardUpdate: backendTrain.jobCardStatus?.lastJobCardUpdate || backendTrain.last_job_update || "",
      trainId: String(backendTrain.id || backendTrain.trainID || ""),
    },

    branding: {
      brandingActive: backendTrain.branding?.brandingActive ?? false,
      brandCampaignID: backendTrain.branding?.brandCampaignID || backendTrain.brand_campaign_id || "",
      exposureHoursAccrued: Number(backendTrain.branding?.exposureHoursAccrued) || 0,
      exposureHoursTarget: Number(backendTrain.branding?.exposureHoursTarget) || 0,
      exposureDailyQuota: Number(backendTrain.branding?.exposureDailyQuota) || 0,
      trainId: String(backendTrain.id || backendTrain.trainID || ""),
    },

    cleaning: {
      cleaningRequired: backendTrain.cleaning?.cleaningRequired ?? true,
      cleaningSlotStatus: backendTrain.cleaning?.cleaningSlotStatus || "pending",
      bayOccupancyIDC: String(backendTrain.cleaning?.bayOccupancyIDC || backendTrain.stabling?.bayPositionID || ""),
      cleaningCrewAssigned: backendTrain.cleaning?.cleaningCrewAssigned || 0,
      lastCleanedDate: backendTrain.cleaning?.lastCleanedDate || "",
      trainId: String(backendTrain.id || backendTrain.trainID || ""),
    },

    stabling: {
      bayPositionID: String(backendTrain.stabling?.bayPositionID || ""),
      shuntingMovesRequired: Number(backendTrain.stabling?.shuntingMovesRequired) || 0,
      stablingSequenceOrder: Number(backendTrain.stabling?.stablingSequenceOrder) || 0,
      trainId: String(backendTrain.id || backendTrain.trainID || ""),
    },

    operations: {
      operationalStatus: backendTrain.operations?.operationalStatus || "Unknown",
      reasonForStatus: backendTrain.operations?.reasonForStatus || "",
      trainId: String(backendTrain.id || backendTrain.trainID || ""),
    },

    // Legacy fields for backward compatibility
    fitness_certificate: {
      expiry_date: backendTrain.fitness?.rollingStockFitnessExpiryDate || "",
    },

    job_cards: generateJobCardsFromBackend(backendTrain),
    cleaning_schedule: backendTrain.cleaning?.cleaningRequired ? "Daily" : "None",
    branding_status: backendTrain.branding?.brandingActive ? "Complete" : "Pending",
    priority_score: calculatePriorityScore(backendTrain),
    availability_confidence: calculateAvailabilityConfidence(backendTrain),
    maintenance_history: Array.isArray(backendTrain.maintenance_history) ? backendTrain.maintenance_history : [
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration_days: 3,
      },
      {
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        duration_days: 2,
      },
    ],
  }

  console.log("[v0] Transformed train result:", transformed)
  return transformed
}

function generateJobCardsFromBackend(backendTrain: any) {
  const jobCards = []

  // Generate open job cards
  for (let i = 0; i < (backendTrain.jobCardStatus?.openJobCards || 0); i++) {
    jobCards.push({
      id: `JOB-${backendTrain.trainID || backendTrain.id}-${i + 1}`,
      status: "open" as const,
      description: `Maintenance job ${i + 1}`,
      created_at: backendTrain.jobCardStatus?.lastJobCardUpdate || new Date().toISOString(),
    })
  }

  // Generate closed job cards
  for (let i = 0; i < (backendTrain.jobCardStatus?.closedJobCards || 0); i++) {
    jobCards.push({
      id: `JOB-${backendTrain.trainID || backendTrain.id}-CLOSED-${i + 1}`,
      status: "closed" as const,
      description: `Completed job ${i + 1}`,
      created_at: backendTrain.jobCardStatus?.lastJobCardUpdate || new Date().toISOString(),
    })
  }

  return jobCards
}

function calculatePriorityScore(backendTrain: any): number {
  let score = 0

  if (backendTrain.fitness?.rollingStockFitnessStatus) score += 30
  if ((backendTrain.jobCardStatus?.openJobCards || 0) === 0) score += 30
  if (backendTrain.branding?.brandingActive) score += 20
  if (backendTrain.cleaning?.cleaningRequired) score += 20

  return score
}

function calculateAvailabilityConfidence(backendTrain: any): number {
  let confidence = 0

  if (backendTrain.fitness?.rollingStockFitnessStatus) confidence += 25
  if (backendTrain.fitness?.signallingFitnessStatus) confidence += 25
  if (backendTrain.fitness?.telecomFitnessStatus) confidence += 25
  if ((backendTrain.jobCardStatus?.openJobCards || 0) === 0) confidence += 25

  return confidence
}


/**
 * Export TRAINSETS as a promise for backward compatibility
 */
export const TRAINSETS_PROMISE = fetchTrainsets()

/**
 * For immediate use in components, export empty array initially
 */
export const TRAINSETS: Trainset[] = []

/**
 * Run as script (optional)
 */
if (require.main === module) {
  ;(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:8000"
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""
    try {
      const parsed = await parseAllTrains(baseUrl, token)
      console.log(JSON.stringify(parsed, null, 2))
    } catch (e: any) {
      console.error("Error parsing trains:", e.message || e)
      process.exit(1)
    }
  })()
}