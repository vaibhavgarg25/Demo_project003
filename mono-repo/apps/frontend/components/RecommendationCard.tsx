"use client"

import type React from "react"

import { Train } from "lucide-react"
import { useState } from "react"
import { SlideOver } from "./SlideOver"
import type { Trainset } from "@/lib/mock-data"

interface RecommendationCardProps {
  trainset: Trainset
  reason: string
  confidence: number
}

export function RecommendationCard({ trainset, reason, confidence }: RecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const statusColors = {
    Active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    Standby: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    Maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    OutOfService: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  }

  return (
    <>
      <div
        className="bg-surface border border-border rounded-xl shadow-md p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-hover rounded-lg flex items-center justify-center">
            <Train className="w-6 h-6 text-text" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-text">{trainset.trainID}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[trainset.status]}`}>
                {trainset.status}
              </span>
            </div>
            <p className="text-sm text-muted truncate">{reason}</p>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted">
              <span>Mileage: {trainset.mileage.toLocaleString()}</span>
              <span>Jobs: {trainset.job_cards.filter((j) => j.status === "open").length}</span>
              <span>Position: {trainset.stabling_position}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="relative w-10 h-10">
              <div className="kpi-ring w-10 h-10" style={{ "--progress": confidence } as React.CSSProperties}>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text">
                  {Math.round(confidence)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted mt-1">Confidence</p>
          </div>
        </div>
      </div>

      <SlideOver
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={`Trainset ${trainset.id}`}
        trainset={trainset}
      />
    </>
  )
}
