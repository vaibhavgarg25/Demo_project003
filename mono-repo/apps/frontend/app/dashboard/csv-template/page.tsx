"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

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

const TEMPLATE_HEADERS = [
  "trainID",
  "trainname",
  "status",
  "stabling_position",
  "fitness_expiry_date",
  "open_job_cards",
  "closed_job_cards",
  "cleaning_schedule",
  "branding_status",
  "total_mileage_km",
  "brake_wear_percent",
  "hvac_wear_percent",
]

export default function CSVTemplatePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
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
    // Normalize headers (trim whitespace and convert to lowercase for comparison)
    const normalizedHeaders = headers.map((h) => h.trim().toLowerCase())
    const normalizedTemplate = TEMPLATE_HEADERS.map((h) => h.toLowerCase())

    const errors: string[] = []
    const warnings: string[] = []

    // Check for missing columns
    const missing = normalizedTemplate.filter((h) => !normalizedHeaders.includes(h))

    // Check for extra columns
    const extra = normalizedHeaders.filter((h) => !normalizedTemplate.includes(h))

    // Check order mismatch
    const orderMismatch =
      normalizedHeaders.length === normalizedTemplate.length &&
      !normalizedHeaders.every((h, i) => h === normalizedTemplate[i])

    if (missing.length > 0) {
      errors.push(`Missing required columns: ${missing.join(", ")}`)
    }

    if (extra.length > 0) {
      warnings.push(`Extra columns found: ${extra.join(", ")}`)
    }

    if (orderMismatch && missing.length === 0) {
      warnings.push("Column order doesn't match template (this is acceptable)")
    }

    return {
      isValid: missing.length === 0,
      errors,
      warnings,
      headerComparison: {
        missing,
        extra,
        orderMismatch,
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

  const handleUpload = async () => {
    if (!uploadedFile || !validationResult?.isValid) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:8000"
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

      const response = await fetch(`${baseUrl}/api/train/upload-csv`, {
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
      console.log("Upload successful:", result)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">CSV Template Management</h1>
        <p className="text-muted-foreground">Download the official template, edit it, and upload your trainset data</p>
      </div>

      {/* Template Download Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Official CSV Template
          </CardTitle>
          <CardDescription>
            Download the official template with the correct column headers and sample data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Template includes these columns:</h4>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_HEADERS.map((header) => (
                  <Badge key={header} variant="secondary" className="text-xs">
                    {header}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={downloadTemplate} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload CSV File
          </CardTitle>
          <CardDescription>Select your edited CSV file to upload trainset data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {uploadedFile ? uploadedFile.name : "Click to select CSV file"}
                </span>
                <span className="text-xs text-muted-foreground">Only .csv files are accepted</span>
              </label>
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className="space-y-3">
                {validationResult.isValid ? (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      CSV validation passed! All required headers are present.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      CSV validation failed. Please fix the following issues:
                    </AlertDescription>
                  </Alert>
                )}

                {/* Detailed validation results */}
                {validationResult.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Errors:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Warnings:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Header comparison */}
                {validationResult.headerComparison && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Header Analysis:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-green-700 dark:text-green-300 mb-1">Expected Headers:</h5>
                        <div className="space-y-1">
                          {TEMPLATE_HEADERS.map((header) => (
                            <div key={header} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {header}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Your Headers:</h5>
                        <div className="space-y-1">
                          {uploadedFile && (
                            <p className="text-xs text-muted-foreground">
                              Headers from your uploaded file will be shown here after validation
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Success */}
            {uploadSuccess && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  File uploaded successfully! Your trainset data has been processed.
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!validationResult?.isValid || isUploading || uploadSuccess}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
