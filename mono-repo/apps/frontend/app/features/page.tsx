"use client"

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
  Database,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

export default function FeaturesPage() {
  const features = [
    {
      icon: <Train className="w-6 h-6" />,
      title: "Fleet Management",
      description: "Comprehensive trainset monitoring and control system",
      details: [
        "Real-time trainset status tracking",
        "Maintenance scheduling and alerts",
        "Performance analytics and reporting",
        "Automated compliance monitoring",
      ],
      category: "Core",
      featured: true,
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Data-driven insights for operational excellence",
      details: [
        "Predictive maintenance algorithms",
        "Performance trend analysis",
        "Cost optimization recommendations",
        "Custom dashboard creation",
      ],
      category: "Analytics",
      featured: true,
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "Intelligent planning and resource allocation",
      details: [
        "Automated schedule optimization",
        "Resource conflict resolution",
        "Dynamic route planning",
        "Crew assignment management",
      ],
      category: "Planning",
      featured: false,
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "System Configuration",
      description: "Flexible system setup and customization",
      details: [
        "Role-based access control",
        "Custom workflow configuration",
        "Integration with existing systems",
        "Multi-language support",
      ],
      category: "Configuration",
      featured: false,
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Security & Compliance",
      description: "Enterprise-grade security and regulatory compliance",
      details: ["End-to-end encryption", "Audit trail logging", "Compliance reporting", "Data backup and recovery"],
      category: "Security",
      featured: false,
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Monitoring",
      description: "Live system monitoring and instant alerts",
      details: [
        "Real-time status updates",
        "Automated alert system",
        "Emergency response protocols",
        "Performance monitoring",
      ],
      category: "Monitoring",
      featured: true,
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Enhanced communication and coordination tools",
      details: [
        "Team messaging and notifications",
        "Task assignment and tracking",
        "Document sharing and version control",
        "Video conferencing integration",
      ],
      category: "Collaboration",
      featured: false,
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Location Tracking",
      description: "GPS-enabled asset and personnel tracking",
      details: [
        "Real-time location monitoring",
        "Geofencing and alerts",
        "Route optimization",
        "Historical location data",
      ],
      category: "Tracking",
      featured: false,
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Data Management",
      description: "Comprehensive data storage and management",
      details: [
        "Centralized data repository",
        "Data import/export tools",
        "Automated data validation",
        "Historical data archiving",
      ],
      category: "Data",
      featured: false,
    },
  ]

  const featuredFeatures = features.filter((f) => f.featured)
  const regularFeatures = features.filter((f) => !f.featured)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-20">
            
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Advanced Features for
              <span className="text-primary block">Modern Transit</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Discover our comprehensive suite of tools designed to streamline metro operations, enhance efficiency, and
              ensure reliable transit services.
            </p>
          </div>

          {/* Featured Features */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Core Capabilities</h2>
              <div className="w-20 h-1 bg-primary rounded-full mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {feature.icon}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* All Features */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Complete Feature Set</h2>
              <div className="w-20 h-1 bg-primary rounded-full mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-md transition-all duration-300 border border-border/50 hover:border-primary/20"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                        {feature.icon}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {feature.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">{feature.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <Card className="max-w-4xl mx-auto border border-border/50">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Transform Your Metro Operations?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Experience the power of modern transit management with our comprehensive platform designed for the
                  future of urban mobility.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Get Started Now
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/help"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                  >
                    Learn More
                  </a>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
