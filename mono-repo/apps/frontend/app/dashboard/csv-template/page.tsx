"use client"

import React, { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, CloudUpload, Download, Upload, FileSpreadsheet } from "lucide-react"
import { FaFileCsv, FaCheckCircle, FaExclamationTriangle, FaCloudUploadAlt, FaDownload } from "react-icons/fa"

/* -------------------------
   Types
   ------------------------- */
type ValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missing?: string[]
  extra?: string[]
}

/* -------------------------
   Helpers
   ------------------------- */
const normalizeHeader = (h: string) =>
  h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")

const REQUIRED_HEADERS = ["trainid", "trainname"]
const KNOWN_OPTIONAL = new Set([
  "rollingstockfitnessstatus",
  "signallingfitnessstatus",
  "telecomfitnessstatus",
  "rollingstockfitnessexpirydate",
  "signallingfitnessexpirydate",
  "telecomfitnessexpirydate",
  "jobcardstatus",
  "openjobcards",
  "closedjobcards",
  "lastjobcardupdate",
  "brandingactive",
  "brandcampaignid",
  "exposurehoursaccrued",
  "exposurehourstarget",
  "exposuredailyquota",
  "totalmileagekm",
  "mileagesincelastservicekm",
  "mileagebalancevariance",
  "brakepadwearpercent",
  "hvacwearpercent",
  "cleaningrequired",
  "cleaningslotstatus",
  "bayoccupancyidc",
  "cleaningcrewassigned",
  "lastcleaneddate",
  "baypositionid",
  "shuntingmovesrequired",
  "stablingsequenceorder",
  "operationalstatus",
  "reasonforstatus",
])

const TEMPLATE_HEADERS = [
  "trainID",
  "trainname",
  "rollingStockFitnessStatus",
  "signallingFitnessStatus",
  "telecomFitnessStatus",
  "fitnessExpiryDate",
  "openJobCards",
  "totalMileageKM",
  "brakepadWearPercent",
  "hvacWearPercent",
  "cleaningRequired",
  "bayPositionID",
  "operationalStatus",
]

export default function CSVTemplatePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [previewRows, setPreviewRows] = useState<string[][] | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)

  /* -------------------------
     Download template
     ------------------------- */
  const downloadTemplate = () => {
    const sampleRow = [
      "TRAIN001",
      "Metro Train 1",
      "true",
      "true",
      "true",
      "2025-12-31",
      "0",
      "15000",
      "12",
      "10",
      "false",
      "A1",
      "in_service",
    ]
    const csv = [TEMPLATE_HEADERS.join(","), sampleRow.join(",")].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "trainset_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  /* -------------------------
     Validation & Preview
     ------------------------- */
  const validateAndPreview = (text: string): ValidationResult => {
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) {
      return { isValid: false, errors: ["❌ File is empty."], warnings: [], missing: REQUIRED_HEADERS, extra: [] }
    }

    const headers = lines[0].split(",").map((h) => h.trim())
    const normalized = headers.map(normalizeHeader)

    const missing = REQUIRED_HEADERS.filter((r) => !normalized.includes(r))
    const extra = normalized.filter((n) => !REQUIRED_HEADERS.includes(n) && !KNOWN_OPTIONAL.has(n))

    const errors: string[] = []
    const warnings: string[] = []
    if (missing.length) errors.push(`⚠️ Missing required: ${missing.join(", ")}`)
    if (extra.length) warnings.push(`ℹ️ Unrecognized columns (ignored): ${extra.join(", ")}`)

    const previews = lines.slice(1, 6).map((ln) => ln.split(",").map((c) => c.trim()))
    setPreviewRows(previews.length ? previews : null)

    const result: ValidationResult = {
      isValid: missing.length === 0,
      errors,
      warnings,
      missing,
      extra,
    }
    setValidation(result)
    return result
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setSendSuccess(false)
    setSendError(null)
    setShowConfirm(false)
    setConfirmChecked(false)
    setPreviewRows(null)
    if (!f) {
      setValidation(null)
      return
    }

    if (!f.name.toLowerCase().endsWith(".csv")) {
      setValidation({ isValid: false, errors: ["❌ Please upload a .csv file."], warnings: [] })
      return
    }

    const text = await f.text()
    validateAndPreview(text)
  }

  const openFileBrowser = () => fileInputRef.current?.click()

  /* -------------------------
     Confirm modal actions
     ------------------------- */
  const handleOpenConfirm = () => {
    if (!file || !validation?.isValid) return
    setShowConfirm(true)
    setConfirmChecked(false)
  }

  const handleCancelConfirm = () => {
    setShowConfirm(false)
    setConfirmChecked(false)
  }

  const handleSend = async () => {
    if (!file || !validation?.isValid || !confirmChecked) return
    setIsSending(true)
    setSendError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:8000"
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch(`${baseUrl}/api/upload/upload`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      setSendSuccess(true)
      setTimeout(() => {
        setFile(null)
        setValidation(null)
        setPreviewRows(null)
        setShowConfirm(false)
        setConfirmChecked(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }, 1800)
    } catch (err: any) {
      setSendError(err?.message || "Upload failed")
    } finally {
      setIsSending(false)
    }
  }

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-2">
          <FaFileCsv className="text-green-500" /> Data Upload
        </h1>
        <p className="text-muted-foreground">
          📝 Step 1: Download → ✍️ Edit → 📤 Upload → ✅ Confirm
        </p>
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Download */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FaDownload className="text-accent" /> Download Template
            </CardTitle>
            <CardDescription>📂 Includes headers + 1 sample row</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_HEADERS.slice(0, 5).map((h) => (
                <Badge key={h} variant="secondary">{h}</Badge>
              ))}
              <Badge variant="outline">+{TEMPLATE_HEADERS.length - 5} more</Badge>
            </div>
            <Button onClick={downloadTemplate} className="w-full bg-accent text-accent-foreground">
              <Download className="w-4 h-4 mr-2" /> Download CSV
            </Button>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FaCloudUploadAlt className="text-blue-500" /> Upload CSV
            </CardTitle>
            <CardDescription>📤 Validate instantly before sending</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button onClick={openFileBrowser} variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" /> Choose File
            </Button>
            <div className="text-sm text-muted-foreground">
              {file ? <span className="text-foreground">📄 {file.name}</span> : "No file selected"}
            </div>

            {/* Validation status */}
            {validation && (
              <div>
                {validation.isValid ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <FaCheckCircle /> Headers OK — Ready to upload
                  </div>
                ) : (
                  <div className="text-red-600 flex gap-2 items-start">
                    <XCircle className="mt-0.5" /> <span>{validation.errors.join(", ")}</span>
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div className="text-yellow-600 flex gap-2 items-start mt-2">
                    <FaExclamationTriangle className="mt-0.5" />
                    <span>{validation.warnings.join(", ")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {previewRows && (
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="text-xs text-muted-foreground mb-1">👀 Preview (first {previewRows.length} rows)</div>
                <table className="table-auto w-full text-sm">
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className={i % 2 ? "bg-muted/50" : ""}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1">{cell || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleOpenConfirm} disabled={!validation?.isValid} className="flex-1 bg-primary text-primary-foreground">
                🚀 Upload & Confirm
              </Button>
              <Button onClick={() => { setFile(null); setValidation(null); setPreviewRows(null); if (fileInputRef.current) fileInputRef.current.value = "" }} variant="outline">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancelConfirm} />
          <div className="relative max-w-lg w-full p-6 rounded-2xl glass-card border border-border">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-blue-500" /> Confirm Upload
            </h3>
            <p className="mt-2 text-muted-foreground text-sm">
              📄 File: <span className="font-medium">{file?.name}</span>
            </p>
            <p className="text-muted-foreground text-sm">This will update trainset records in the database.</p>

            <label className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">✅ I confirm this file is correct.</span>
            </label>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSend} disabled={!confirmChecked || isSending} className="flex-1 bg-green-600 text-white">
                {isSending ? "⏳ Sending..." : "📤 Send to Database"}
              </Button>
              <Button onClick={handleCancelConfirm} variant="outline">Cancel</Button>
            </div>

            {sendError && <div className="mt-2 text-red-600 text-sm">❌ {sendError}</div>}
            {sendSuccess && <div className="mt-2 text-green-600 text-sm">🎉 Success! File processed.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
