"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun, Clock, Palette, Type, Download } from "lucide-react"

interface SettingsState {
  showWatermarkClock: boolean
  clockPosition: "header" | "sidebar"
  compactMode: boolean
}

export default function SettingsPage() {
  const { theme, setTheme, themes } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<SettingsState>({
    showWatermarkClock: false,
    clockPosition: "header",
    compactMode: false,
  })

  useEffect(() => {
    setMounted(true)

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("dashboard-settings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, [])

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem("dashboard-settings", JSON.stringify(newSettings))
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all stored data? This will remove planner history and settings.")) {
      localStorage.removeItem("planner-history")
      localStorage.removeItem("dashboard-settings")
      setSettings({
        showWatermarkClock: false,
        clockPosition: "header",
        compactMode: false,
      })
      alert("All data cleared successfully!")
    }
  }

  const exportData = () => {
    const data = {
      plannerHistory: localStorage.getItem("planner-history"),
      settings: localStorage.getItem("dashboard-settings"),
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `kochi-metro-dashboard-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-2">Settings</h1>
          <p className="text-muted">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2 text-balance">Settings</h1>
        <p className="text-muted">Customize your dashboard experience and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appearance Settings */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-text" />
              <h2 className="text-lg font-semibold text-text">Appearance</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2 ${
                      theme === "light" ? "border-text bg-bg-hover" : "border-border hover:bg-bg-hover"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span className="text-sm">Light</span>
                  </button>

                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2 ${
                      theme === "dark" ? "border-text bg-bg-hover" : "border-border hover:bg-bg-hover"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span className="text-sm">Dark</span>
                  </button>

                  <button
                    onClick={() => setTheme("system")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2 ${
                      theme === "system" ? "border-text bg-bg-hover" : "border-border hover:bg-bg-hover"
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span className="text-sm">System</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => updateSetting("compactMode", e.target.checked)}
                    className="rounded border-border"
                  />
                  <div>
                    <span className="text-sm font-medium text-text">Compact Mode</span>
                    <p className="text-xs text-muted">Reduce spacing and padding for more content</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Clock Settings */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-text" />
              <h2 className="text-lg font-semibold text-text">Clock Display</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-3">Clock Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSetting("clockPosition", "header")}
                    className={`p-3 rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2 ${
                      settings.clockPosition === "header"
                        ? "border-text bg-bg-hover"
                        : "border-border hover:bg-bg-hover"
                    }`}
                  >
                    Header
                  </button>

                  <button
                    onClick={() => updateSetting("clockPosition", "sidebar")}
                    className={`p-3 rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2 ${
                      settings.clockPosition === "sidebar"
                        ? "border-text bg-bg-hover"
                        : "border-border hover:bg-bg-hover"
                    }`}
                  >
                    Sidebar
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.showWatermarkClock}
                    onChange={(e) => updateSetting("showWatermarkClock", e.target.checked)}
                    className="rounded border-border"
                  />
                  <div>
                    <span className="text-sm font-medium text-text">Watermark Clock</span>
                    <p className="text-xs text-muted">Show large faint clock in background</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-text" />
              <h2 className="text-lg font-semibold text-text">Typography</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Font Family</label>
                <p className="text-sm text-muted mb-3">
                  Currently using Chirp font. Place font files in{" "}
                  <code className="px-1 py-0.5 bg-bg-hover rounded text-xs">public/fonts/</code>
                </p>
                <div className="p-3 bg-bg-hover rounded-md border border-border">
                  <p className="text-sm text-text">
                    Sample text in Chirp font - The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-text mb-2">Font Files Required</h3>
                <ul className="text-xs text-muted space-y-1">
                  <li>• chirp-regular.woff2</li>
                  <li>• chirp-medium.woff2</li>
                  <li>• chirp-bold.woff2</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-text" />
              <h2 className="text-lg font-semibold text-text">Data Management</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text mb-2">Export Data</h3>
                <p className="text-xs text-muted mb-3">Download your planner history and settings as a JSON file</p>
                <button
                  onClick={exportData}
                  className="px-4 py-2 bg-text text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
                >
                  Export Data
                </button>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-text mb-2">Clear All Data</h3>
                <p className="text-xs text-muted mb-3">
                  Remove all stored planner history and reset settings to defaults
                </p>
                <button
                  onClick={clearAllData}
                  className="px-4 py-2 border border-red-600 text-red-600 dark:border-red-400 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text mb-4">About</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Version</span>
                <span className="text-text">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Framework</span>
                <span className="text-text">Next.js 14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Build Date</span>
                <span className="text-text">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <p className="text-xs text-muted">
                Kochi Metro Fleet Induction Dashboard - Professional fleet management and allocation system
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
