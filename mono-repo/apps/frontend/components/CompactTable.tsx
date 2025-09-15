"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, Search, Eye, Settings } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [fitnessFilter, setFitnessFilter] = useState<number>(0)
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible }), {} as Record<SortKey, boolean>),
  )
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((trainset) => {
      const matchesSearch =
        String(trainset.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trainset.code && trainset.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        trainset.stabling_position.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || trainset.status === statusFilter

      const fitnessExpiry = trainset.fitness_certificate?.expiry_date
        ? daysUntil(trainset.fitness_certificate.expiry_date)
        : 999 // Default to high value if no expiry date
      const matchesFitness = fitnessFilter === 0 || fitnessExpiry <= fitnessFilter

      return matchesSearch && matchesStatus && matchesFitness
    })

    // Sort data
    if (sortKey === "fitnessExpiry") {
      filtered = filtered.sort((a, b) => {
        const aExpiry = a.fitness_certificate?.expiry_date ? daysUntil(a.fitness_certificate.expiry_date) : 999
        const bExpiry = b.fitness_certificate?.expiry_date ? daysUntil(b.fitness_certificate.expiry_date) : 999
        return sortDirection === "asc" ? aExpiry - bExpiry : bExpiry - aExpiry
      })
    } else if (sortKey === "openJobs") {
      filtered = filtered.sort((a, b) => {
        const aJobs = a.job_cards?.filter((j) => j.status === "open").length || 0
        const bJobs = b.job_cards?.filter((j) => j.status === "open").length || 0
        return sortDirection === "asc" ? aJobs - bJobs : bJobs - aJobs
      })
    } else {
      filtered = sortByKey(filtered, sortKey as keyof Trainset, sortDirection)
    }

    return filtered
  }, [data, searchTerm, statusFilter, fitnessFilter, sortKey, sortDirection])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const toggleColumn = (key: SortKey) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search trainsets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Standby">Standby</option>
          <option value="Maintenance">Maintenance</option>
          <option value="OutOfService">Out of Service</option>
        </select>

        <select
          value={fitnessFilter}
          onChange={(e) => setFitnessFilter(Number(e.target.value))}
          className="px-3 py-2 border border-border rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
        >
          <option value={0}>All Fitness</option>
          <option value={7}>Expires in 7 days</option>
          <option value={30}>Expires in 30 days</option>
          <option value={90}>Expires in 90 days</option>
        </select>

        <div className="relative">
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="px-3 py-2 border border-border rounded-md bg-background text-text hover:bg-bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
          >
            <Settings className="w-4 h-4" />
          </button>

          {showColumnPicker && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-10">
              <div className="p-2">
                <p className="text-sm font-medium text-text mb-2">Visible Columns</p>
                {columns.map((column) => (
                  <label key={column.key} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.key]}
                      onChange={() => toggleColumn(column.key)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-text">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
                    {visibleColumns.id && <td className="px-4 py-3 text-sm font-medium text-text">{trainset.id}</td>}
                    {visibleColumns.status && (
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[trainset.status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"}`}
                        >
                          {trainset.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.fitnessExpiry && (
                      <td className="px-4 py-3 text-sm text-text">
                        <span className={fitnessExpiry < 7 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                          {fitnessExpiry < 999 ? `${fitnessExpiry} days` : "No data"}
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
