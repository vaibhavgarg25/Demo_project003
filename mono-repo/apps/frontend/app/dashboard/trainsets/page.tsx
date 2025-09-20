"use client"

import { useState, useEffect, useMemo } from "react"
import { CompactTable } from "@/components/CompactTable"
import { TrainsetModal } from "@/components/TrainsetModal"
import { fetchTrainsets, type Trainset } from "@/lib/mock-data"
import { daysUntil } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Grid, List, Search, Settings, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { FaTools, FaShieldAlt, FaBolt, FaTrain } from "react-icons/fa"
import { FiTruck, FiActivity } from "react-icons/fi"
import { MdDirectionsRun, MdOutlineCleaningServices } from "react-icons/md"
import { GiHealthPotion, GiClockwork } from "react-icons/gi"
import { TbTrain } from "react-icons/tb"

/* -------------------------
   Helpers
   ------------------------- */

const formatKm = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M km` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k km` : `${n} km`

const CircularProgress = ({
  value,
  size = 80,
  strokeWidth = 8,
  label = "Health",
}: {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (value / 100) * circumference

  const getColorClass = (val: number) => {
    if (val >= 85) return "text-green-500"
    if (val >= 70) return "text-amber-500"
    return "text-red-500"
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          className={`${getColorClass(value)} health-ring`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-bold text-foreground">{Math.round(value)}%</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

/* -------------------------
   Health + recommendation
   ------------------------- */

function daysUntilSafe(d: string | Date) {
  try {
    return daysUntil(d as any)
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

function computeRawHealth(trainset: any): number {
  const safeNum = (v: any, cap = 100) => (typeof v === "number" && !Number.isNaN(v) ? Math.max(0, Math.min(v, cap)) : 0)

  const fitnessFlags = [
    trainset.fitness?.rollingStockFitnessStatus,
    trainset.fitness?.signallingFitnessStatus,
    trainset.fitness?.telecomFitnessStatus,
  ]
  const fitnessPopulated = fitnessFlags.filter((f) => f !== undefined && f !== null).length
  const fitnessTrue = fitnessFlags.filter((f) => f === true).length
  const fitnessPercent = fitnessPopulated ? (fitnessTrue / fitnessPopulated) * 100 : 50

  const expiryDates = [
    trainset.fitness?.rollingStockFitnessExpiryDate,
    trainset.fitness?.signallingFitnessExpiryDate,
    trainset.fitness?.telecomFitnessExpiryDate,
  ].filter(Boolean)
  const minExpiryDays = expiryDates.length
    ? Math.min(...expiryDates.map((d: any) => daysUntilSafe(d)))
    : Number.POSITIVE_INFINITY
  let expiryPenalty = 0
  if (minExpiryDays <= 0) expiryPenalty = 40
  else if (minExpiryDays <= 7) expiryPenalty = 20
  else if (minExpiryDays <= 30) expiryPenalty = 10

  const openJobs = trainset.jobCardStatus?.openJobCards ?? 0
  const jobPenalty = Math.min(openJobs * 3, 30)

  const mileage = safeNum(trainset.mileage?.totalMileageKM ?? 0, 1_000_000)
  const mileageScore = 100 * (1 / (1 + Math.pow(mileage / 180000, 1.2)))

  const brake = safeNum(trainset.mileage?.brakepadWearPercent ?? 0, 100)
  const hvac = safeNum(trainset.mileage?.hvacWearPercent ?? 0, 100)
  const wearScore = brake || hvac ? Math.max(0, 100 - (brake + hvac) / 2) : 70

  const cleaningPenalty = trainset.cleaning?.cleaningRequired ? 10 : 0
  const brandingBoost = trainset.branding?.brandingActive ? 4 : 0
  const opScore = safeNum(trainset.operations?.score ?? 70, 100)

  const raw =
    0.28 * fitnessPercent +
    0.22 * mileageScore +
    0.2 * wearScore +
    0.2 * opScore +
    0.1 * 100 -
    expiryPenalty -
    jobPenalty -
    cleaningPenalty +
    brandingBoost

  return Math.round(Math.max(0, Math.min(100, raw)))
}

function mapToDisplayHealth(raw: number): number {
  return Math.round(70 + (raw / 100) * 20)
}

function getHealthScoreFromModel(trainset: any): number {
  return mapToDisplayHealth(computeRawHealth(trainset))
}

function getRecommendationReason(trainset: any): string {
  const openJobs = trainset.jobCardStatus?.openJobCards ?? 0
  const totalMileage = trainset.mileage?.totalMileageKM ?? 0
  const soon = [
    trainset.fitness?.rollingStockFitnessExpiryDate,
    trainset.fitness?.signallingFitnessExpiryDate,
    trainset.fitness?.telecomFitnessExpiryDate,
  ]
    .filter(Boolean)
    .map((d: any) => daysUntilSafe(d))
    .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)

  if (soon <= 0) return `⚠️ Fitness expired — ground until recertified`
  if (openJobs > 5) return `🛠 ${openJobs} open jobs — prioritize maintenance`
  if (totalMileage > 250000) return `🚄 High mileage (${Math.round(totalMileage)} km) — inspect`

  return `ℹ️ ${openJobs} open jobs • ${Math.round(totalMileage).toLocaleString()} km`
}

/* -------------------------
   Main page
   ------------------------- */

export default function TrainsetsPage() {
  const [trainsets, setTrainsets] = useState<Trainset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTrainset, setSelectedTrainset] = useState<Trainset | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Standby" | "Maintenance" | "OutOfService">("All")
  const [fitnessFilter, setFitnessFilter] = useState<"All" | "High" | "Medium" | "Low">("All")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchTrainsets()
        if (!mounted) return
        setTrainsets(data || [])
        setError(null)
      } catch (e) {
        console.error(e)
        setError("Failed to load trainsets")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedTrainset) {
        setSelectedTrainset(null)
      }
    }

    document.addEventListener("keydown", handleEscKey)
    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [selectedTrainset])

  const filteredTrainsets = useMemo(() => {
    return (trainsets || [])
      .map((t) => ({
        ...t,
        raw_health: computeRawHealth(t),
        health_score: getHealthScoreFromModel(t),
        recommendation: getRecommendationReason(t),
      }))
      .filter((t) => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return true
        return (
          (t.trainname || "").toLowerCase().includes(q) ||
          (t.trainID || "").toLowerCase().includes(q) ||
          (t.operations?.operationalStatus || t.status || "").toString().toLowerCase().includes(q)
        )
      })
      .filter((t) => {
        if (statusFilter === "All") return true
        const s = (t.operations?.operationalStatus || t.status || "").toString().toLowerCase()
        if (statusFilter === "Active") return s === "in_service" || t.status === "Active"
        if (statusFilter === "Standby") return s === "standby" || t.status === "Standby"
        if (statusFilter === "Maintenance") return s.includes("maint") || t.status === "Maintenance"
        if (statusFilter === "OutOfService")
          return s === "out_of_service" || t.status === "OutOfService" || s.includes("out")
        return true
      })
      .filter((t) => {
        if (fitnessFilter === "All") return true
        const s = t.health_score || 0
        if (fitnessFilter === "High") return s >= 80
        if (fitnessFilter === "Medium") return s >= 60 && s < 80
        return s < 60
      })
      .sort((a, b) => (b.raw_health || 0) - (a.raw_health || 0))
  }, [trainsets, searchQuery, statusFilter, fitnessFilter])

  const totalTrainsets = trainsets.length
  const inServiceTrains = trainsets.filter(
    (t) =>
      t.operations?.operationalStatus?.toString()?.toLowerCase() === "in_service" || (t as any).status === "Active",
  ).length
  const maintenanceTrainsets = trainsets.filter(
    (t) =>
      t.operations?.operationalStatus?.toString()?.toLowerCase()?.includes("maint") ||
      (t as any).status === "Maintenance",
  ).length
  const standbyTrainsets = trainsets.filter(
    (t) => t.operations?.operationalStatus?.toString()?.toLowerCase() === "standby" || (t as any).status === "Standby",
  ).length

  const availabilityRate = totalTrainsets > 0 ? Math.round((inServiceTrains / totalTrainsets) * 100) : 0
  const totalOpenJobs = trainsets.reduce((s, t) => s + (t.jobCardStatus?.openJobCards || 0), 0)
  const fitnessExpiringSoon = trainsets.filter((t) => {
    if (!t.fitness?.rollingStockFitnessExpiryDate) return false
    const d = daysUntilSafe(t.fitness.rollingStockFitnessExpiryDate as any)
    return d <= 30 && d > 0
  }).length

  /* -------------------
     Render
     ------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="text-xl font-semibold text-foreground">🚆 Loading trainsets…</div>
          <div className="text-sm text-muted-foreground">Fetching fleet data</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="glass-card p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">❌ Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            <FiActivity className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background">
  <div className="max-w-7xl mx-auto px-6 py-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
        <TbTrain className="text-teal-500" /> Trainset Fleet Management
      </h1>
      <div className="text-right">
        <div className="text-xl font-semibold text-green-600">{availabilityRate}%</div>
        <div className="text-sm text-muted-foreground">Fleet Availability</div>
      </div>
    </div>
  </div>
</div>


      {/* Metrics */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Fleet</div>
                <div className="text-3xl font-bold text-foreground">{totalTrainsets}</div>
                <div className="text-xs text-muted-foreground mt-1">🚉 Active trainsets</div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <FaTrain className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </div>

          <div className="metric-card group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">In Service</div>
                <div className="text-3xl font-bold text-green-600">{inServiceTrains}</div>
                <div className="text-xs text-green-600/70 mt-1">🟢 {availabilityRate}% availability</div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="metric-card group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Maintenance</div>
                <div className="text-3xl font-bold text-amber-600">{maintenanceTrainsets}</div>
                <div className="text-xs text-muted-foreground mt-1">🛠 {standbyTrainsets} on standby</div>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <FaTools className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="metric-card group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Open Jobs</div>
                <div className="text-3xl font-bold text-red-600">{totalOpenJobs}</div>
                <div className="text-xs text-muted-foreground mt-1">⏳ {fitnessExpiringSoon} fitness expiring</div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="🔍 Search by name, ID, or status..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-muted rounded-lg p-1 border">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="gap-2"
                >
                  <Grid className="w-4 h-4" /> 📇 Cards
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-2"
                >
                  <List className="w-4 h-4" /> 📑 List
                </Button>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-10 px-4 rounded-md bg-background border border-border text-foreground"
              >
                <option value="All">All Status</option>
                <option value="Active">🟢 Active</option>
                <option value="Standby">🟡 Standby</option>
                <option value="Maintenance">🛠 Maintenance</option>
                <option value="OutOfService">🔴 Out of Service</option>
              </select>

              <select
                value={fitnessFilter}
                onChange={(e) => setFitnessFilter(e.target.value as any)}
                className="h-10 px-4 rounded-md bg-background border border-border text-foreground"
              >
                <option value="All">All Health</option>
                <option value="High">💪 High (80%+)</option>
                <option value="Medium">⚖️ Medium (60-79%)</option>
                <option value="Low">❌ Low (&lt;60%)</option>
              </select>

              
            </div>
          </div>
        </div>







        {/* Trainset list/cards */}
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrainsets.map((t) => {
              const health = t.health_score || getHealthScoreFromModel(t)
              const reason = t.recommendation || getRecommendationReason(t)

              return (
                <article
                  key={t.trainID}
                  onClick={() => setSelectedTrainset(t)}
                  className="glass-card p-6 cursor-pointer hover:scale-105 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-foreground truncate">
                          🚆 {t.trainname || `Train ${t.trainID}`}
                        </h3>
                        <span className="status-pill">{t.status}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <FaBolt className="w-3 h-3 text-yellow-500" />
                        <span className="truncate">ID: {t.trainID}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center mb-6">
                    <CircularProgress value={health} size={100} strokeWidth={8} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-surface rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                        <FiTruck className="w-3 h-3 text-blue-500" /> Mileage
                      </div>
                      <div className="font-bold text-foreground">{formatKm(t.mileage?.totalMileageKM || 0)}</div>
                    </div>

                    <div className="text-center p-3 bg-surface rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                        <FaTools className="w-3 h-3 text-amber-600" /> Jobs
                      </div>
                      <div className="font-bold text-foreground">{t.jobCardStatus?.openJobCards ?? 0}</div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <FaShieldAlt className="w-3 h-3 text-purple-500" /> Status
                    </div>
                    <div className="text-sm text-foreground font-medium line-clamp-2">{reason}</div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <CompactTable data={filteredTrainsets} onRowClick={(r) => setSelectedTrainset(r)} />
          </div>
        )}

        {selectedTrainset && (
          <TrainsetModal
            isOpen={!!selectedTrainset}
            onClose={() => setSelectedTrainset(null)}
            trainset={selectedTrainset}
          />
        )}


        
      </div>
    </div>
  )
}
