"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, Eye } from "lucide-react"
import type { Trainset } from "@/lib/mock-data"
import { daysUntil, sortByKey } from "@/lib/utils"

interface CompactTableProps {
  data: Trainset[]
  onRowClick?: (trainset: Trainset) => void
}

type SortKey = keyof Trainset | "fitnessExpiry" | "openJobs"
type SortDirection = "asc" | "desc"

const statusColors = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  Standby: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  Maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  OutOfService: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
}

const columns = [
  { key: "id" as SortKey, label: "ID", visible: true },
  { key: "status" as SortKey, label: "Status", visible: true },
  { key: "fitnessExpiry" as SortKey, label: "Fitness Days", visible: true },
  { key: "openJobs" as SortKey, label: "Open Jobs", visible: true },
  { key: "mileage" as SortKey, label: "Mileage", visible: true },
  { key: "stabling_position" as SortKey, label: "Position", visible: false },
]

export function CompactTable({ data, onRowClick }: CompactTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [visibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible }), {} as Record<SortKey, boolean>),
  )
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredAndSortedData = useMemo(() => {
    // No search/status/fitness filtering here — the parent page provides already-filtered data if needed.
    let working = [...data]

    // Sort data
    if (sortKey === "fitnessExpiry") {
      working = working.sort((a, b) => {
        const aExpiry = a.fitness_certificate?.expiry_date ? daysUntil(a.fitness_certificate.expiry_date) : 999
        const bExpiry = b.fitness_certificate?.expiry_date ? daysUntil(b.fitness_certificate.expiry_date) : 999
        return sortDirection === "asc" ? aExpiry - bExpiry : bExpiry - aExpiry
      })
    } else if (sortKey === "openJobs") {
      working = working.sort((a, b) => {
        const aJobs = a.job_cards?.filter((j) => j.status === "open").length || 0
        const bJobs = b.job_cards?.filter((j) => j.status === "open").length || 0
        return sortDirection === "asc" ? aJobs - bJobs : bJobs - aJobs
      })
    } else {
      working = sortByKey(working, sortKey as keyof Trainset, sortDirection)
    }

    return working
  }, [data, sortKey, sortDirection])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 text-center">
        <p className="text-muted">No trainset data available. Please check your API connection.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* NOTE: Filters removed — expect the parent to supply already-filtered data if needed */}

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-hover">
              <tr>
                {columns.map(
                  (column) =>
                    visibleColumns[column.key] && (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:bg-background transition-colors"
                        onClick={() => handleSort(column.key)}
                      >
                        <div className="flex items-center gap-1">
                          {column.label}
                          {sortKey === column.key &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                    ),
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((trainset) => {
                const fitnessExpiry = trainset.fitness_certificate?.expiry_date
                  ? daysUntil(trainset.fitness_certificate.expiry_date)
                  : 999
                const openJobs = trainset.job_cards?.filter((j) => j.status === "open").length || 0

                return (
                  <tr
                    key={trainset.id}
                    className="hover:bg-bg-hover transition-colors cursor-pointer"
                    onClick={() => onRowClick?.(trainset)}
                  >
                    {visibleColumns.id && (
                      <td className="px-4 py-3 text-sm font-medium text-text">{trainset.trainID}</td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[trainset.status] ||
                            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          }`}
                        >
                          {trainset.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.fitnessExpiry && (
                      <td className="px-4 py-3 text-sm text-text">
                        <span className={fitnessExpiry <= 7 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                          {typeof fitnessExpiry === "number" ? `${Math.max(fitnessExpiry, 0)} days` : "No data"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.openJobs && (
                      <td className="px-4 py-3 text-sm text-text">
                        <span className={openJobs > 2 ? "text-orange-600 dark:text-orange-400 font-medium" : ""}>
                          {openJobs}
                        </span>
                      </td>
                    )}
                    {visibleColumns.mileage && (
                      <td className="px-4 py-3 text-sm text-text">
                        {typeof trainset.mileage === "number"
                          ? trainset.mileage.toLocaleString()
                          : typeof trainset.mileage === "object" && trainset.mileage?.totalMileageKM
                          ? trainset.mileage.totalMileageKM.toLocaleString()
                          : 0}{" "}
                        km
                      </td>
                    )}
                    {visibleColumns.stabling_position && (
                      <td className="px-4 py-3 text-sm text-text">{trainset.stabling_position || "N/A"}</td>
                    )}
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRowClick?.(trainset)
                        }}
                        className="p-1 rounded-md hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
                        aria-label={`View details for ${trainset.id}`}
                      >
                        <Eye className="w-4 h-4 text-muted" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length}{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background text-text hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background text-text hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredAndSortedData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted">No trainsets found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
