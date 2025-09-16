"use client"

import { Navigation } from "@/components/Navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Play,
  Settings,
  Users,
  CheckCircle,
  Download,
  Upload,
  FileText,
  AlertTriangle,
  Lightbulb,
  MessageCircle,
  ExternalLink,
} from "lucide-react"

export default function HelpPage() {
  const quickStartSteps = [
    {
      step: 1,
      title: "Account Access",
      description: "Login using your administrator-provided credentials to access the metro management system.",
      icon: <Users className="w-5 h-5" />,
      time: "2 min",
    },
    {
      step: 2,
      title: "Dashboard Overview",
      description: "Explore the main dashboard to understand fleet status, key metrics, and system health.",
      icon: <Play className="w-5 h-5" />,
      time: "5 min",
    },
    {
      step: 3,
      title: "Fleet Exploration",
      description: "Navigate through trainset inventory, check real-time status, and access detailed information.",
      icon: <Settings className="w-5 h-5" />,
      time: "10 min",
    },
    {
      step: 4,
      title: "Operations Management",
      description: "Utilize planning tools for maintenance scheduling, crew assignments, and route optimization.",
      icon: <CheckCircle className="w-5 h-5" />,
      time: "15 min",
    },
  ]

  const faqs = [
    {
      question: "How do I upload and validate CSV templates?",
      answer:
        "Navigate to the CSV Template section from your dashboard. Download the official template with pre-configured headers, populate it with your data, and upload it back. Our system performs strict validation to ensure data integrity and will provide detailed error messages if any issues are detected.",
      category: "Data Management",
    },
    {
      question: "What should I do if CSV headers don't match the template?",
      answer:
        "The system requires exact header matching including names, order, and case sensitivity. If validation fails, you'll receive a comprehensive error report showing missing columns, extra columns, or order mismatches. Correct these issues in your file and re-upload for processing.",
      category: "Data Management",
    },
    {
      question: "How can I reset my account password?",
      answer:
        "For security purposes, password resets must be handled by your system administrator. Contact your IT department or designated admin with your user ID and they will initiate the reset process for you.",
      category: "Account",
    },
    {
      question: "Can I export system data for external analysis?",
      answer:
        "Yes, most data views include comprehensive export functionality. Look for download icons in tables and reports to export data in various formats including CSV, PDF, and Excel. Some reports may require specific permissions.",
      category: "Data Management",
    },
    {
      question: "How frequently is system data updated?",
      answer:
        "The system provides real-time updates for most operational data including fleet status and alerts. Analytics and complex reports may have a processing delay of 1-5 minutes depending on data complexity and system load.",
      category: "System",
    },
    {
      question: "Which web browsers are officially supported?",
      answer:
        "The system is optimized for modern browsers including Chrome (recommended), Firefox, Safari, and Microsoft Edge. Internet Explorer is not supported. For best performance, ensure your browser is updated to the latest version.",
      category: "Technical",
    },
    {
      question: "How do I report bugs or request new features?",
      answer:
        "Use the integrated feedback system within the application or contact your administrator. When reporting issues, include detailed reproduction steps, screenshots, browser information, and any error messages to help our team resolve problems quickly.",
      category: "Support",
    },
  ]

  const csvWorkflow = [
    {
      title: "Download Template",
      description: "Get the official CSV template with correct headers and data format specifications.",
      icon: <Download className="w-4 h-4" />,
      color: "text-primary",
    },
    {
      title: "Edit Locally",
      description: "Open in Excel, Google Sheets, or your preferred editor to add your operational data.",
      icon: <FileText className="w-4 h-4" />,
      color: "text-secondary",
    },
    {
      title: "Validate Format",
      description: "Ensure headers match exactly and data follows required format before uploading.",
      icon: <CheckCircle className="w-4 h-4" />,
      color: "text-accent",
    },
    {
      title: "Upload & Process",
      description: "Upload your completed file through the secure web interface for processing.",
      icon: <Upload className="w-4 h-4" />,
      color: "text-primary",
    },
  ]

  const faqCategories = Array.from(new Set(faqs.map((faq) => faq.category)))

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-20">
            
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Everything You Need to
              <span className="text-primary block">Get Started</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive guides, tutorials, and support resources to help you master your metro management system and
              optimize your operations.
            </p>
          </div>

          {/* Quick Start Guide */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Quick Start Guide</h2>
              <div className="w-20 h-1 bg-primary rounded-full mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStartSteps.map((step, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-primary text-primary-foreground">Step {step.step}</Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {step.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {step.icon}
                      </div>
                      <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {step.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CSV Template Management */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">CSV Template Management</h2>
              <div className="w-20 h-1 bg-primary rounded-full mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-destructive">
                    <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    Critical CSV Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <h4 className="font-semibold text-destructive mb-3">Header Validation Requirements</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {[
                        "Headers must match exactly (case-sensitive)",
                        "Column order must be preserved as in template",
                        "No extra or missing columns allowed",
                        "Leading/trailing whitespace is automatically trimmed",
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    Upload Process
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {csvWorkflow.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className={`${step.color} mt-0.5`}>{step.icon}</div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">{step.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
              <div className="w-20 h-1 bg-primary rounded-full mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <Card className="sticky top-24 border border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {faqCategories.map((category, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        >
                          <span className="font-medium text-sm">{category}</span>
                          <Badge variant="secondary" className="text-xs">
                            {faqs.filter((faq) => faq.category === category).length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border border-border/50 rounded-lg px-4 hover:shadow-md transition-all duration-300"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <div className="flex items-start gap-3 text-left">
                          <Badge variant="outline" className="mt-1 text-xs">
                            {faq.category}
                          </Badge>
                          <span className="font-medium text-sm leading-relaxed">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4 leading-relaxed text-sm">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="text-center">
            <Card className="max-w-4xl mx-auto ">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">Still Need Assistance?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Our dedicated support team is ready to help you resolve any issues and optimize your metro management
                  experience.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:support@kochimetro.com"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Support
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href="/dashboard/csv-template"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-sm font-medium  bg-background text-foreground hover:bg-muted transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    CSV Template Page
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
