"use client"

import { useState, useEffect } from "react"
import { CompactTable } from "@/components/CompactTable"
import { TrainsetModal } from "@/components/TrainsetModal"
import { fetchTrainsets, type Trainset } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Grid, List, Search, Settings, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const CircularProgress = ({
  value,
  size = 60,
  strokeWidth = 6,
}: {
  value: number
  size?: number
  strokeWidth?: number
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  // choose color based on thresholds
  let colorClass = "text-emerald-500" // default green
  if (value <= 33) {
    colorClass = "text-red-500"
  } else if (value <= 66) {
    colorClass = "text-orange-500"
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`${colorClass} transition-all duration-300 ease-in-out`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
    </div>
  )
}

const MiniChart = ({ data, color = "bg-chart-1" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, index) => (
        <div
          key={index}
          className={`${color} rounded-sm w-1.5 transition-all duration-300`}
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  )
}

export default function TrainsetsPage() {
  const [trainsets, setTrainsets] = useState<Trainset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTrainset, setSelectedTrainset] = useState<Trainset | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    status: true,
    fitnessDays: true,
    openJobs: true,
    mileage: true,
    position: false,
  })

  // New filters moved to top
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Maintenance">("All")
  const [fitnessFilter, setFitnessFilter] = useState<"All" | "High" | "Medium" | "Low">("All")

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

  // apply search + status + fitness filters
  const filteredTrainsets = trainsets
    .filter(
      (trainset) =>
        trainset.trainname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainset.status.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((t) => (statusFilter === "All" ? true : t.status === statusFilter))
    .filter((t) => {
      if (fitnessFilter === "All") return true
      const score = t.availability_confidence || 0
      if (fitnessFilter === "High") return score >= 80
      if (fitnessFilter === "Medium") return score >= 60 && score < 80
      return score < 60
    })

  const handleRowClick = (trainset: Trainset) => {
    setSelectedTrainset(trainset)
  }

  const handleCloseModal = () => {
    setSelectedTrainset(null)
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-chart-3"
    if (score >= 60) return "text-chart-4"
    return "text-destructive"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Trainset Management</h1>
            <p className="text-muted-foreground">Loading trainset data...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg h-80 animate-pulse border"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Trainset Management</h1>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry Loading</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Trainset Management</h1>
          <p className="text-muted-foreground">Monitor and manage all trainsets in the fleet</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="bg-muted/40 rounded-xl p-4 text-center hover:shadow-md hover:bg-muted/60 transition-all">
            <div className="text-2xl font-bold text-foreground">{trainsets.length}</div>
            <div className="text-sm text-muted-foreground">Total Trainsets</div>
            <div className="mt-3 h-1 bg-chart-2 rounded-full"></div>
          </div>
          <div className="bg-muted/40 rounded-xl p-4 text-center hover:shadow-md hover:bg-muted/60 transition-all">
            <div className="text-2xl font-bold text-chart-3">
              {trainsets.filter((t) => t.status === "Active").length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="mt-3 h-1 bg-chart-3 rounded-full"></div>
          </div>
          <div className="bg-muted/40 rounded-xl p-4 text-center hover:shadow-md hover:bg-muted/60 transition-all">
            <div className="text-2xl font-bold text-secondary">
              {trainsets.filter((t) => t.status === "Maintenance").length}
            </div>
            <div className="text-sm text-muted-foreground">In Maintenance</div>
            <div className="mt-3 h-1 bg-secondary rounded-full"></div>
          </div>
          <div className="bg-muted/40 rounded-xl p-4 text-center hover:shadow-md hover:bg-muted/60 transition-all">
            <div className="text-2xl font-bold text-destructive">
              {trainsets.reduce((sum, t) => sum + t.jobCardStatus.openJobCards, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Open Jobs</div>
            <div className="mt-3 h-1 bg-destructive rounded-full"></div>
          </div>
        </div>


        {/* Top controls bar (search + view toggles + status/fitness/select + settings) */}
        <div className="bg-muted/40 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search trainsets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-input"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {filteredTrainsets.length} of {trainsets.length} trainsets
              </span>

              <div className="flex items-center bg-background  rounded-lg p-1">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="flex items-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
              </div>

              {/* Status filter (moved to top) */}
              <div>
                <label className="sr-only">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 px-3 rounded-md  bg-background text-sm border border-input"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              {/* Fitness filter (moved to top) */}
              <div>
                <label className="sr-only">Fitness</label>
                <select
                  value={fitnessFilter}
                  onChange={(e) => setFitnessFilter(e.target.value as any)}
                  className="h-9 px-3 rounded-md  bg-background text-sm border border-input"
                >
                  <option value="All">All Fitness</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Enhanced Settings dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-2 bg-background border border-border shadow-xl rounded-xl backdrop-blur-sm"
                  sideOffset={8}
                >
                  <div className="px-3 py-2 mb-2">
                    <DropdownMenuLabel className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Column Visibility
                    </DropdownMenuLabel>
                    <p className="text-xs text-muted-foreground mt-1">Configure which columns to display in list view</p>
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  
                  <div className="space-y-1">
                    <div 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/60 ${
                        visibleColumns.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                      onClick={() => setVisibleColumns((prev) => ({ ...prev, id: !prev.id }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          visibleColumns.id ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {visibleColumns.id && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium">Train ID</span>
                      </div>
                    </div>

                    <div 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/60 ${
                        visibleColumns.status ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                      onClick={() => setVisibleColumns((prev) => ({ ...prev, status: !prev.status }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          visibleColumns.status ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {visibleColumns.status && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium">Status</span>
                      </div>
                    </div>

                    <div 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/60 ${
                        visibleColumns.fitnessDays ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                      onClick={() => setVisibleColumns((prev) => ({ ...prev, fitnessDays: !prev.fitnessDays }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          visibleColumns.fitnessDays ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {visibleColumns.fitnessDays && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium">Fitness Days</span>
                      </div>
                    </div>

                    <div 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/60 ${
                        visibleColumns.openJobs ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                      onClick={() => setVisibleColumns((prev) => ({ ...prev, openJobs: !prev.openJobs }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          visibleColumns.openJobs ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {visibleColumns.openJobs && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium">Open Jobs</span>
                      </div>
                    </div>

                    <div 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/60 ${
                        visibleColumns.mileage ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                      onClick={() => setVisibleColumns((prev) => ({ ...prev, mileage: !prev.mileage }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          visibleColumns.mileage ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {visibleColumns.mileage && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium">Mileage</span>
                      </div>
                    </div>

                    <div 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/60 ${
                        visibleColumns.position ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                      onClick={() => setVisibleColumns((prev) => ({ ...prev, position: !prev.position }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          visibleColumns.position ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {visibleColumns.position && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium">Position</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-2" />
                  <div className="px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      {Object.values(visibleColumns).filter(Boolean).length} of {Object.keys(visibleColumns).length} columns visible
                    </p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main content */}
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredTrainsets.map((trainset) => {
            const healthScore = trainset.availability_confidence || 0
            const mileageData: number[] = Array.isArray((trainset as any).mileage)
              ? ((trainset as any).mileage as number[])
              : typeof (trainset as any).mileage === "number"
              ? [((trainset as any).mileage as number)]
              : [
                  (trainset as any).mileage?.totalMileageKM ?? 0,
                  (trainset as any).mileage?.mileageSinceLastServiceKM ?? 0,
                  (trainset as any).mileage?.mileageBalanceVariance ?? 0,
                ]
            const mileageTotal: number =
              typeof (trainset as any).mileage === "number"
                ? ((trainset as any).mileage as number)
                : (trainset as any).mileage?.totalMileageKM ?? 0
            const formatKm = (n: number) =>
              n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M km` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k km` : `${n} km`
        
            return (
              <div
                key={trainset.id}
                onClick={() => handleRowClick(trainset)}
                className="bg-gradient-to-br from-background via-card to-background/80 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.02] group"
              >
                {/* Header */}
                <div className="p-6 pb-4 bg-gradient-to-r from-muted/40 to-muted/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                        🚆 {trainset.trainname}
                      </h3>
                      <p className="text-xs text-muted-foreground">Train {trainset.trainID}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge
                        className={`text-xs px-2 py-1 font-medium rounded-md shadow-sm ${
                          trainset.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : trainset.status === "Maintenance"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {trainset.status}
                      </Badge>
                      {trainset.jobCardStatus.openJobCards > 0 && (
                        <div className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-1 rounded-md shadow-sm">
                          ⚠️ Job Card: Open
                        </div>
                      )}
                    </div>
                  </div>
                </div>
        
                {/* Body */}
                <div className="p-6 space-y-8">
                  {/* Health Score */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Health Score</div>
                      <div className="text-xs text-muted-foreground">Overall system health</div>
                    </div>
                    <CircularProgress value={healthScore} size={70} />
                  </div>
        
        
                  <div className="grid grid-cols-2 gap-6">
                      {/* Availability */}
                      <div className="space-y-2 text-center">
                        <div className="text-xs font-medium text-muted-foreground">Availability</div>
                        <div className="flex flex-col items-center gap-2">
                          <Progress value={trainset.availability_confidence || 0} className="h-2 w-20 rounded-full" />
                          <span className="text-sm font-semibold text-foreground">
                            {trainset.availability_confidence || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Weekly Mileage */}
                      <div className="space-y-2 text-center">
                        <div className="text-xs font-medium text-muted-foreground">Weekly Mileage</div>
                        <div className="flex items-center justify-center gap-3">
                          <MiniChart data={mileageData} color="bg-chart-1" />
                          <span className="text-sm font-semibold text-foreground">
                            {formatKm(mileageTotal)}
                          </span>
                        </div>
                      </div>
                      </div>
        
                  {/* Location + Open Jobs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl p-4 text-center bg-gradient-to-br from-muted/30 to-muted/10 shadow-inner">
                      <div className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                        📍 {trainset.stabling_position || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">Location</div>
                    </div>
                    <div className="rounded-xl p-4 text-center bg-gradient-to-br from-muted/30 to-muted/10 shadow-inner">
                      <div
                        className={`text-lg font-bold flex items-center justify-center gap-1 ${
                          trainset.jobCardStatus.openJobCards > 0 ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        🛠 {trainset.jobCardStatus.openJobCards}
                      </div>
                      <div className="text-xs text-muted-foreground">Open Jobs</div>
                    </div>
                  </div>
        
                  {/* Sub-metrics */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg p-3 bg-muted/20 backdrop-blur-sm shadow-sm">
                      <div className="text-sm font-bold text-foreground">
                        {(() => {
                          const hvacWear = trainset.mileage.hvacWearPercent ?? 0
                          const hvacHealth = Math.max(0, Math.min(100, 100 - Number(hvacWear)))
                          return `${hvacHealth.toFixed(1)}%`
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground">HVAC</div>
                    </div>
                    <div className="rounded-lg p-3 bg-muted/20 backdrop-blur-sm shadow-sm">
                      <div className="text-sm font-bold text-amber-500">
                        {`${(trainset.mileage.brakepadWearPercent ?? 0)}%`}
                      </div>
                      <div className="text-xs text-muted-foreground">Brake Wear</div>
                    </div>
                    <div className="rounded-lg p-3 bg-muted/20 backdrop-blur-sm shadow-sm">
                      <div className="text-sm font-bold text-emerald-500">
                        {`${(trainset.branding.exposureHoursAccrued ?? 0)}h`}
                      </div>
                      <div className="text-xs text-muted-foreground">Branding</div>
                    </div>
                  </div>
                </div>
        
               
              </div>
            )
          })}
        </div>
        
        
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden shadow-sm">
            <CompactTable data={filteredTrainsets} onRowClick={handleRowClick} />
          </div>
        )}

        {selectedTrainset && (
          <TrainsetModal isOpen={!!selectedTrainset} onClose={handleCloseModal} trainset={selectedTrainset} />
        )}
      </div>
    </div>
  )
}