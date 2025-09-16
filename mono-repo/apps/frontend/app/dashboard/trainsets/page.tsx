"use client"

import { useState, useEffect } from "react"
import { CompactTable } from "@/components/CompactTable"
import { TrainsetModal } from "@/components/TrainsetModal"
import { fetchTrainsets, type Trainset } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Grid, List, Search, Settings } from "lucide-react"
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
  color = "text-chart-3",
}: {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`${color} transition-all duration-300 ease-in-out`}
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
          <div className="bg-card rounded-lg border p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-foreground">{trainsets.length}</div>
            <div className="text-sm text-muted-foreground">Total Trainsets</div>
            <div className="mt-2 h-1 bg-chart-2 rounded-full"></div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-chart-3">
              {trainsets.filter((t) => t.status === "Active").length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="mt-2 h-1 bg-chart-3 rounded-full"></div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-secondary">
              {trainsets.filter((t) => t.status === "Maintenance").length}
            </div>
            <div className="text-sm text-muted-foreground">In Maintenance</div>
            <div className="mt-2 h-1 bg-secondary rounded-full"></div>
          </div>
          <div className="bg-card rounded-lg border p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-destructive">
              {trainsets.reduce((sum, t) => sum + t.jobCardStatus.openJobCards, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Open Jobs</div>
            <div className="mt-2 h-1 bg-destructive rounded-full"></div>
          </div>
        </div>

        {/* Top controls bar (search + view toggles + status/fitness/select + settings) */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
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

              <div className="flex items-center bg-background border rounded-lg p-1">
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
                  className="h-9 px-3 rounded-md border bg-background text-sm"
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
                  className="h-9 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="All">All Fitness</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Settings dropdown (always visible now) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-neutral-900 border border-border shadow-md rounded-md"
                >
                  <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.id}
                    onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, id: checked }))}
                  >
                    ID
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.status}
                    onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, status: checked }))}
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.fitnessDays}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, fitnessDays: checked }))
                    }
                  >
                    Fitness Days
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.openJobs}
                    onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, openJobs: checked }))}
                  >
                    Open Jobs
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.mileage}
                    onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, mileage: checked }))}
                  >
                    Mileage
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.position}
                    onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, position: checked }))}
                  >
                    Position
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main content */}
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrainsets.map((trainset) => {
              const healthScore = trainset.availability_confidence || 0
              const mockMileageData = [85, 92, 78, 95, 88, 91, 87]

              return (
                <div
                  key={trainset.id}
                  onClick={() => handleRowClick(trainset)}
                  className="bg-card rounded-xl border hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.02] group"
                >
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">Train #{trainset.id}</h3>
                        <p className="text-sm text-muted-foreground">{trainset.trainname}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge
                          className={`text-xs font-medium border-0 ${
                            trainset.status === "Active"
                              ? "bg-chart-3/20 text-chart-3"
                              : trainset.status === "Maintenance"
                              ? "bg-secondary/20 text-secondary"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {trainset.status}
                        </Badge>
                        {trainset.jobCardStatus.openJobCards > 0 && (
                          <div className="text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded">
                            Job Card: Open
                          </div>
                        )}
                        <div className="text-xs text-chart-3 font-medium bg-chart-3/10 px-2 py-1 rounded">
                          Cert: Valid
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-sm font-semibold text-foreground mb-1">Health Score</div>
                        <div className="text-xs text-muted-foreground">Overall system health</div>
                      </div>
                      <CircularProgress value={healthScore} color={getHealthScoreColor(healthScore)} size={56} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Availability</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Progress value={trainset.availability_confidence || 0} className="h-2" />
                          </div>
                          <span className="text-sm font-semibold text-foreground min-w-[35px]">
                            {trainset.availability_confidence || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Weekly Mileage</div>
                        <div className="flex items-center justify-between">
                          <MiniChart data={mockMileageData} color="bg-chart-1" />
                          <span className="text-sm font-semibold text-foreground">12.8k km</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-foreground mb-1">
                          {trainset.stabling_position || "N/A"}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">Location</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <div
                          className={`text-2xl font-bold mb-1 ${
                            trainset.jobCardStatus.openJobCards > 0 ? "text-destructive" : "text-chart-3"
                          }`}
                        >
                          {trainset.jobCardStatus.openJobCards}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">Open Jobs</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="text-sm font-bold text-foreground">98.5%</div>
                        <div className="text-xs text-muted-foreground">HVAC</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="text-sm font-bold text-secondary">21%</div>
                        <div className="text-xs text-muted-foreground">Brake Wear</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="text-sm font-bold text-chart-3">171h</div>
                        <div className="text-xs text-muted-foreground">Branding</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-muted/20 border-t group-hover:bg-muted/40 transition-colors">
                    <div className="text-xs text-muted-foreground text-center font-medium">Click to view details →</div>
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
