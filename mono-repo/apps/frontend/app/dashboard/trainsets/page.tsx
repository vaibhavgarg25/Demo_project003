"use client"

import { useState, useEffect } from "react"
import { CompactTable } from "@/components/CompactTable"
import { TrainsetModal } from "@/components/TrainsetModal"
import { fetchTrainsets, type Trainset } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Grid, List, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function TrainsetsPage() {
  const [trainsets, setTrainsets] = useState<Trainset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTrainset, setSelectedTrainset] = useState<Trainset | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [searchQuery, setSearchQuery] = useState("")

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

  const filteredTrainsets = trainsets.filter(
    (trainset) =>
      trainset.trainname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainset.status.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRowClick = (trainset: Trainset) => {
    setSelectedTrainset(trainset)
  }

  const handleCloseModal = () => {
    setSelectedTrainset(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Trainset Management
          </h1>
          <p style={{ color: "var(--muted-foreground)" }}>
            Monitor and manage all trainsets in the Kochi Metro fleet
          </p>
        </div>
        <div
          className="rounded-lg p-8"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="animate-pulse space-y-4">
            <div className="h-4 rounded w-1/4" style={{ backgroundColor: "var(--border)" }}></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded" style={{ backgroundColor: "var(--border)" }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Trainset Management
          </h1>
          <p style={{ color: "var(--muted-foreground)" }}>
            Monitor and manage all trainsets in the Kochi Metro fleet
          </p>
        </div>
        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: "var(--destructive-foreground)",
            border: "1px solid var(--destructive)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--destructive)" }}
          >
            Error Loading Data
          </h2>
          <p style={{ color: "var(--destructive)" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-md transition-colors"
            style={{ backgroundColor: "var(--destructive)", color: "var(--destructive-foreground)" }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Trainset Management
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          Monitor and manage all trainsets in the Kochi Metro fleet
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--muted-foreground)" }}
          />
          <Input
            placeholder="Search trainsets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="flex items-center gap-2"
          >
            <Grid className="w-4 h-4" />
            Cards
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTrainsets.map((trainset) => (
            <div
              key={trainset.id}
              onClick={() => handleRowClick(trainset)}
              className="group rounded-xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate mb-1" style={{ color: "var(--foreground)" }}>
                    {trainset.id}
                  </h3>
                  <p className="text-sm truncate" style={{ color: "var(--muted-foreground)" }}>
                    {trainset.trainname}
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold shrink-0 ml-2"
                  style={{
                    backgroundColor:
                      trainset.status === "Active"
                        ? "var(--accent)"
                        : trainset.status === "Maintenance"
                        ? "var(--secondary)"
                        : "var(--destructive)",
                    color:
                      trainset.status === "Active"
                        ? "var(--accent-foreground)"
                        : trainset.status === "Maintenance"
                        ? "var(--secondary-foreground)"
                        : "var(--destructive-foreground)",
                  }}
                >
                  {trainset.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                    Location
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {trainset.stabling_position || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                    Availability
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${trainset.availability_confidence || 0}%`,
                          backgroundColor: "var(--accent)",
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {trainset.availability_confidence || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                    Open Jobs
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color:
                        trainset.jobCardStatus.openJobCards > 0
                          ? "var(--destructive)"
                          : "var(--accent)",
                    }}
                  >
                    {trainset.jobCardStatus.openJobCards}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div
                  className="text-xs transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Click to view details →
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CompactTable data={filteredTrainsets} onRowClick={handleRowClick} />
      )}

      {selectedTrainset && (
        <TrainsetModal isOpen={!!selectedTrainset} onClose={handleCloseModal} trainset={selectedTrainset} />
      )}
    </div>
  )
}
