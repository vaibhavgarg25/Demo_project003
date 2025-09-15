"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Navigation } from "@/components/Navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Train,
  BarChart3,
  Calendar,
  Settings,
  Shield,
  Zap,
  Users,
  MapPin,
  Clock,
  Database,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"

export default function FeaturesPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!theme) {
      setTheme("dark")
    }
  }, [theme, setTheme])

  const features = [
    {
      icon: <Train className="w-8 h-8" />,
      title: "Fleet Management",
      description: "Comprehensive trainset monitoring and control system",
      details: [
        "Real-time trainset status tracking",
        "Maintenance scheduling and alerts",
        "Performance analytics and reporting",
        "Automated compliance monitoring",
      ],
      category: "Core",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Advanced Analytics",
      description: "Data-driven insights for operational excellence",
      details: [
        "Predictive maintenance algorithms",
        "Performance trend analysis",
        "Cost optimization recommendations",
        "Custom dashboard creation",
      ],
      category: "Analytics",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Smart Scheduling",
      description: "Intelligent planning and resource allocation",
      details: [
        "Automated schedule optimization",
        "Resource conflict resolution",
        "Dynamic route planning",
        "Crew assignment management",
      ],
      category: "Planning",
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "System Configuration",
      description: "Flexible system setup and customization",
      details: [
        "Role-based access control",
        "Custom workflow configuration",
        "Integration with existing systems",
        "Multi-language support",
      ],
      category: "Configuration",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Security & Compliance",
      description: "Enterprise-grade security and regulatory compliance",
      details: ["End-to-end encryption", "Audit trail logging", "Compliance reporting", "Data backup and recovery"],
      category: "Security",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Monitoring",
      description: "Live system monitoring and instant alerts",
      details: [
        "Real-time status updates",
        "Automated alert system",
        "Emergency response protocols",
        "Performance monitoring",
      ],
      category: "Monitoring",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Enhanced communication and coordination tools",
      details: [
        "Team messaging and notifications",
        "Task assignment and tracking",
        "Document sharing and version control",
        "Video conferencing integration",
      ],
      category: "Collaboration",
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Location Tracking",
      description: "GPS-enabled asset and personnel tracking",
      details: [
        "Real-time location monitoring",
        "Geofencing and alerts",
        "Route optimization",
        "Historical location data",
      ],
      category: "Tracking",
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Data Management",
      description: "Comprehensive data storage and management",
      details: [
        "Centralized data repository",
        "Data import/export tools",
        "Automated data validation",
        "Historical data archiving",
      ],
      category: "Data",
    },
  ]

  const categoryColors = {
    Core: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    Analytics: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    Planning: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    Configuration: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    Security: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    Monitoring: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    Collaboration: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    Tracking: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    Data: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  }

  const ThemeToggle = () => {
    if (!mounted) {
      return <div className="w-10 h-10" />
    }

    return (
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg">
        <button
          onClick={() => setTheme("light")}
          className={`p-2 rounded-md transition-colors ${
            theme === "light"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
          aria-label="Light mode"
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`p-2 rounded-md transition-colors ${
            theme === "dark"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
          aria-label="Dark mode"
        >
          <Moon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`p-2 rounded-md transition-colors ${
            theme === "system"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
          aria-label="System mode"
        >
          <Monitor className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ThemeToggle />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">Powerful Features</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Discover the comprehensive suite of tools designed to streamline your metro operations, enhance
              efficiency, and ensure reliable transit services.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {feature.icon}
                    </div>
                    <Badge
                      variant="secondary"
                      className={categoryColors[feature.category as keyof typeof categoryColors]}
                    >
                      {feature.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Transform Your Operations?</h2>
              <p className="text-muted-foreground mb-6">
                Experience the power of modern metro management with our comprehensive platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Get Started
                </a>
                <a
                  href="/how-to-use"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border border-border bg-background text-foreground hover:bg-accent transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
