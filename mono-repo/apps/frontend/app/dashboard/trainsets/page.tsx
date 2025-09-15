"use client"

import { useState, useEffect } from "react"
import { CompactTable } from "@/components/CompactTable"
import { SlideOver } from "@/components/SlideOver"
import { fetchTrainsets, type Trainset } from "@/lib/mock-data"

export default function TrainsetsPage() {
  const [trainsets, setTrainsets] = useState<Trainset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTrainset, setSelectedTrainset] = useState<Trainset | null>(null)

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

  const handleRowClick = (trainset: Trainset) => {
    setSelectedTrainset(trainset)
  }

  const handleCloseSlideOver = () => {
    setSelectedTrainset(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text mb-2 text-balance">Trainset Management</h1>
          <p className="text-muted">Monitor and manage all trainsets in the Kochi Metro fleet</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-border rounded w-1/4"></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-border rounded"></div>
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
          <h1 className="text-2xl font-bold text-text mb-2 text-balance">Trainset Management</h1>
          <p className="text-muted">Monitor and manage all trainsets in the Kochi Metro fleet</p>
        </div>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2 text-balance">Trainset Management</h1>
        <p className="text-muted">Monitor and manage all trainsets in the Kochi Metro fleet</p>
      </div>

      <CompactTable data={trainsets} onRowClick={handleRowClick} />

      {selectedTrainset && (
        <SlideOver
          isOpen={!!selectedTrainset}
          onClose={handleCloseSlideOver}
          title={`Trainset ${selectedTrainset.id}`}
          trainset={selectedTrainset}
        />
      )}
    </div>
  )
}
