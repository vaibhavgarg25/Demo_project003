import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Mail, Phone, Clock, Users, BookOpen, Video } from "lucide-react"

const supportOptions = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Get instant help from our support team during business hours.",
    availability: "Mon-Fri, 9 AM - 6 PM IST",
    responseTime: "< 2 minutes",
    badge: "Fastest",
    action: "Start Chat",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us detailed questions and receive comprehensive answers.",
    availability: "24/7 submission",
    responseTime: "< 4 hours",
    badge: "Detailed",
    action: "Send Email",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Speak directly with our technical experts for complex issues.",
    availability: "Mon-Fri, 9 AM - 6 PM IST",
    responseTime: "Immediate",
    badge: "Personal",
    action: "Call Now",
  },
]

const resources = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Comprehensive guides and API documentation",
    link: "Browse Docs",
  },
  {
    icon: Video,
    title: "Video Library",
    description: "Step-by-step tutorials and feature walkthroughs",
    link: "Watch Videos",
  },
  {
    icon: Users,
    title: "Community Forum",
    description: "Connect with other users and share best practices",
    link: "Join Community",
  },
]

export function HelpSupport() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Get Support</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
            Choose the support option that works best for you. Our team is here to help you succeed.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {supportOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <Badge className="absolute -top-2 -right-2 text-xs">{option.badge}</Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed mb-4">{option.description}</CardDescription>
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {option.availability}
                    </div>
                    <div className="text-accent font-medium">Response: {option.responseTime}</div>
                  </div>
                  <Button className="w-full" size="lg">
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Resources */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-4">Additional Resources</h3>
          <p className="text-muted-foreground mb-8">
            Explore our self-service resources for quick answers and learning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {resources.map((resource, index) => {
            const Icon = resource.icon
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h4>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{resource.description}</p>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    {resource.link}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Contact Information */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Emergency Support</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl mx-auto">
              For critical system issues affecting your operations, our emergency support line is available 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-destructive" />
                <span className="font-medium">Emergency:</span>
                <span className="text-destructive">+91 484 2345 999</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-medium">Email:</span>
                <span className="text-primary">emergency@kochimetro.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
