// parseTrains.ts
// Usage: ts-node parseTrains.ts http://localhost:4000 YOUR_TOKEN
// npm i axios
import axios from "axios"

/**
 * Minimal types for API responses. Adjust if your API has a different shape.
 */
type TrainRaw = {
  id?: string
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
  // plus any other fields your API might return
  [k: string]: any
}

type SubResource = { [k: string]: any }

type MemorizedTrain = {
  id: string
  trainname: string
  trainID: string
  createdAt: string
  updatedAt: string
  fitness: {
    rollingStockFitnessStatus: boolean
    signallingFitnessStatus: boolean
    telecomFitnessStatus: boolean
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
    cleaningCrewAssigned: number
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
    trainId: string
  }
}

/**
 * Export the MemorizedTrain type as Trainset for backward compatibility
 * — avoid impossible intersection where `mileage` would be both number and object.
 */
export type Trainset = Omit<MemorizedTrain, "mileage"> & {
  // Legacy fields for backward compatibility
  code: string
  status: "Active" | "Standby" | "Maintenance" | "OutOfService"
  // Allow either the old numeric mileage or the new structured mileage object
  mileage: number | MemorizedTrain["mileage"]
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
  // ensure TS knows these can be read
  const trainID =
    (base && (base.trainID as string)) ||
    (base && (base.code as string)) ||
    (base && (base.id as string)) ||
    (base && (base.trainId as string)) ||
    ""

  return {
    id: (base && ((base.id as string) || trainID)) || "",
    trainname: (base && (base.trainname as string)) || `Train-${trainID || (base && (base.id as string)) || ""}`,
    trainID: trainID,
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
      signallingFitnessStatus:
        typeof fitness.signallingFitnessStatus === "boolean" ? fitness.signallingFitnessStatus : true,
      telecomFitnessStatus: typeof fitness.telecomFitnessStatus === "boolean" ? fitness.telecomFitnessStatus : true,
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
        stabling.bayPositionID ||
        "",
      cleaningCrewAssigned: cleaning.cleaningCrewAssigned ?? cleaning.crew_assigned ?? 0,
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

  // fetch subresources for each train in parallel (settled to be robust)
  const settled = await Promise.all(
    trainsArray.map(async (t) => {
      const idForEndpoints = t.id || t.code || t.trainID || t.trainId || ""

      const results = await Promise.allSettled([
        fetchJson(`${root}/api/train/getTrains`, token),
      ])

      const valuify = (p: PromiseSettledResult<any>) => (p && p.status === "fulfilled" ? p.value : {})

      // Since only one resource is fetched, use empty objects for others
      const fitness = {}
      const jobCard = {}
      const branding = {}
      const mileage = {}
      const cleaning = {}
      const stabling = {}
      const operations = {}
      const fullTrain = results[0] && results[0].status === "fulfilled" ? results[0].value : t

      return buildMemorizedTrain({
        base: fullTrain,
        fitness,
        jobCard,
        branding,
        mileage,
        cleaning,
        stabling,
        operations,
      })
    }),
  )

  return settled
}

/**
 * Transform MemorizedTrain to legacy Trainset format
 */
function transformToLegacyFormat(train: MemorizedTrain): Trainset {
  // Defensive extraction of total mileage to satisfy both type-shapes at runtime.
  const totalMileage =
    train &&
    train.mileage &&
    typeof (train.mileage as MemorizedTrain["mileage"]).totalMileageKM === "number"
      ? (train.mileage as MemorizedTrain["mileage"]).totalMileageKM
      : 0

  return {
    ...train,
    code: train.trainID,
    status: (train.operations.operationalStatus as any) || "Active",
    // `mileage` in Trainset can be either the legacy number or the object — we set the number here
    mileage: totalMileage,
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
    const token = typeof window !== "undefined" ? localStorage.getItem('token') : null

    const trains = await parseAllTrains(baseUrl, token || undefined)
    return trains.map(transformToLegacyFormat)
  } catch (error) {
    console.error("Failed to fetch trainsets:", error)
    // Return empty array on error to prevent crashes
    return []
  }
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
    const token = typeof window !== "undefined" ? localStorage.getItem('token') || "" : ""
    try {
      const parsed = await parseAllTrains(baseUrl, token)
      console.log(JSON.stringify(parsed, null, 2))
    } catch (e: any) {
      console.error("Error parsing trains:", e.message || e)
      process.exit(1)
    }
  })()
}
