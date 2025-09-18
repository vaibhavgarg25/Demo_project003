"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  CloudUpload,
} from "lucide-react"

type ValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  headerComparison?: {
    missing: string[]
    extra: string[]
    orderMismatch: boolean
  }
}

// Recommended headers for user guidance only. Validation will be lenient and only
// require the minimal fields the backend needs to upsert a train: trainID, trainname.
const TEMPLATE_HEADERS = [
  "trainID",
  "trainname",
  // Optional/common fields (informational)
  "rollingStockFitnessStatus",
  "signallingFitnessStatus",
  "telecomFitnessStatus",
  "fitnessExpiryDate",
  "lastFitnessCheckDate",
  "jobCardStatus",
  "openJobCards",
  "closedJobCards",
  "lastJobCardUpdate",
  "brandingActive",
  "brandCampaignID",
  "exposureHoursAccrued",
  "exposureHoursTarget",
  "exposureDailyQuota",
  "totalMileageKM",
  "mileageSinceLastServiceKM",
  "mileageBalanceVariance",
  "brakepadWearPercent",
  "hvacWearPercent",
  "cleaningRequired",
  "cleaningSlotStatus",
  "bayOccupancyIDC",
  "cleaningCrewAssigned",
  "lastCleanedDate",
  "bayPositionID",
  "shuntingMovesRequired",
  "stablingSequenceOrder",
  "operationalStatus",
  "reasonForStatus",
]

export default function CSVTemplatePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    // Create CSV template with headers and sample data
    const csvContent = [
      TEMPLATE_HEADERS.join(","),
      "TRAIN001,Metro Train 1,Active,BAY-A1,2024-12-31,2,5,Daily,Complete,15000,15,8",
      "TRAIN002,Metro Train 2,Standby,BAY-B2,2024-11-30,0,3,Weekly,Pending,12500,22,12",
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "trainset_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const validateCSVHeaders = (headers: string[]): ValidationResult => {
    // Match backend normalization: lowercased, non-alphanumerics removed
    const normalize = (h: string) =>
      h
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
    const normalizedHeaders = headers.map((h) => normalize(h))

    // Minimal required to upsert a train
    const required = ["trainid", "trainname"]

    // Known optional/canonical headers supported by backend (for info only)
    const knownOptional = new Set([
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

    const errors: string[] = []
    const warnings: string[] = []

    // Required columns check (only trainid, trainname)
    const missing = required.filter((h) => !normalizedHeaders.includes(h))

    // Extra/unknown columns (informational only)
    const extra = normalizedHeaders.filter((h) => !required.includes(h) && !knownOptional.has(h))

    if (missing.length > 0) {
      errors.push(`Missing required columns: ${missing.join(", ")}`)
    }

    if (extra.length > 0) {
      warnings.push(`Unrecognized columns (will be ignored): ${extra.join(", ")}`)
    }

    return {
      isValid: missing.length === 0,
      errors,
      warnings,
      headerComparison: {
        missing,
        extra,
        orderMismatch: false,
      },
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setValidationResult(null)
    setUploadSuccess(false)

    // Read and validate the CSV file
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n")
      if (lines.length > 0) {
        const headers = lines[0].split(",")
        const validation = validateCSVHeaders(headers)
        setValidationResult(validation)
      }
    }
    reader.readAsText(file)
  }

  const handleUploadClick = () => {
    if (!uploadedFile || !validationResult?.isValid) return
    setShowConfirmation(true)
  }

  const handleConfirmUpload = async () => {
    if (!uploadedFile || !validationResult?.isValid) return

    setShowConfirmation(false)
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:8000"
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

      const response = await fetch(`${baseUrl}/api/upload/upload`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      setUploadSuccess(true)

      // Reset form after successful upload
      setTimeout(() => {
        setUploadedFile(null)
        setValidationResult(null)
        setUploadSuccess(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 3000)
    } catch (error) {
      console.error("Upload failed:", error)
      setValidationResult({
        ...validationResult,
        isValid: false,
        errors: [
          ...(validationResult?.errors || []),
          `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancelUpload = () => {
    setShowConfirmation(false)
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-balance text-foreground">CSV Template Management</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Download the official template, edit it locally, and upload your trainset data with confidence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template Download Card */}
        <Card className="border-2 border-accent bg-muted">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl text-foreground">Official CSV Template</CardTitle>
            <CardDescription className="text-muted-foreground">
              Download the official template with correct column headers and sample data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-background border border-border">
              <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Template includes these columns:
              </h4>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {TEMPLATE_HEADERS.slice(0, 8).map((header) => (
                  <Badge key={header} variant="secondary" className="text-xs justify-center">
                    {header}
                  </Badge>
                ))}
                {TEMPLATE_HEADERS.length > 8 && (
                  <Badge variant="outline" className="text-xs justify-center">
                    +{TEMPLATE_HEADERS.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={downloadTemplate} className="w-full bg-accent text-accent-foreground" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        {/* File Upload Card */}
        <Card className="border-2 border-border bg-muted">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mb-4">
              <CloudUpload className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl text-foreground">Upload CSV File</CardTitle>
            <CardDescription className="text-muted-foreground">
              Select your edited CSV file to upload trainset data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-background hover:bg-muted transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-base font-medium text-foreground">
                    {uploadedFile ? uploadedFile.name : "Click to select CSV file"}
                  </span>
                  <span className="text-sm text-muted-foreground block">Only .csv files are accepted</span>
                </div>
              </label>
            </div>

            <Button
              onClick={handleUploadClick}
              disabled={!validationResult?.isValid || isUploading || uploadSuccess}
              className="w-full bg-primary text-primary-foreground"
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Card className="border-2 border-border bg-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.isValid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-accent">Validation Successful</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-destructive" />
                  <span className="text-destructive">Validation Failed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult.isValid ? (
              <Alert className="border border-accent bg-muted">
                <CheckCircle className="w-4 h-4 text-accent" />
                <AlertDescription className="text-foreground">
                  CSV validation passed! All required headers are present and your file is ready for upload.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border border-destructive bg-muted">
                <XCircle className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  CSV validation failed. Please fix the following issues before uploading:
                </AlertDescription>
              </Alert>
            )}

            {validationResult.errors.length > 0 && (
              <div className="p-4 rounded-lg border border-destructive bg-muted">
                <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Errors that must be fixed:
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-destructive">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="p-4 rounded-lg border border-secondary bg-muted">
                <h4 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warnings (file will still be processed):
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-secondary">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Success */}
      {uploadSuccess && (
        <Card className="border-2 border-accent bg-muted">
          <CardContent className="pt-6">
            <Alert className="border border-accent bg-transparent">
              <CheckCircle className="w-4 h-4 text-accent" />
              <AlertDescription className="text-foreground">
                🎉 File uploaded successfully! Your trainset data has been processed and is now available in the system.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black text-white rounded-lg p-8 max-w-md mx-4 border border-gray-600">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-800  rounded-full flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold ">Confirm Upload</h3>
              <p className="">
                Are you sure you want to upload <span className="font-medium text-white">{uploadedFile?.name}</span>? 
                This will process and store the trainset data in the system.
              </p>
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleCancelUpload}
                  variant="outline"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmUpload}
                  className="flex-1  hover:bg-gray-200"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
