import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, CheckCircle } from "lucide-react"

const quickStartSteps = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Sign up for your Kochi Metro Fleet account and verify your email address.",
    duration: "2 minutes",
    status: "essential",
  },
  {
    step: 2,
    title: "Set Up Your Fleet",
    description: "Add your vehicles, define routes, and configure basic settings for your operation.",
    duration: "10 minutes",
    status: "essential",
  },
  {
    step: 3,
    title: "Invite Your Team",
    description: "Add team members and assign appropriate roles and permissions.",
    duration: "5 minutes",
    status: "recommended",
  },
  {
    step: 4,
    title: "Configure Monitoring",
    description: "Set up real-time monitoring, alerts, and notification preferences.",
    duration: "8 minutes",
    status: "recommended",
  },
  {
    step: 5,
    title: "Start Tracking",
    description: "Begin monitoring your fleet operations and explore the dashboard features.",
    duration: "Ongoing",
    status: "optional",
  },
]

export function QuickStart() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Quick Start Guide</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
            Get up and running in under 30 minutes with our step-by-step setup process
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {quickStartSteps.map((item, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{item.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            item.status === "essential"
                              ? "default"
                              : item.status === "recommended"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.duration}</span>
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed mb-4">{item.description}</CardDescription>
                <Button variant="ghost" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
                  Learn more
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Follow our interactive setup wizard to configure your fleet management system in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8">
                  <Play className="mr-2 h-5 w-5" />
                  Start Setup Wizard
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                  Watch Video Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
