"use client"

import { useState } from "react"
import { CompactTable } from "@/components/CompactTable"
import { SlideOver } from "@/components/SlideOver"
import { TRAINSETS, type Trainset } from "@/lib/mock-data"

export default function TrainsetsPage() {
  const [selectedTrainset, setSelectedTrainset] = useState<Trainset | null>(null)

  const handleRowClick = (trainset: Trainset) => {
    setSelectedTrainset(trainset)
  }

  const handleCloseSlideOver = () => {
    setSelectedTrainset(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2 text-balance">Trainset Management</h1>
        <p className="text-muted">Monitor and manage all trainsets in the Kochi Metro fleet</p>
      </div>

      <CompactTable data={TRAINSETS} onRowClick={handleRowClick} />

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
