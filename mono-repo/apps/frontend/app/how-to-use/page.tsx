"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Navigation } from "@/components/Navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  BookOpen,
  Play,
  Settings,
  Users,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Download,
  Upload,
  FileText,
  AlertTriangle,
  Lightbulb,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"

export default function HelpPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!theme) {
      setTheme("dark")
    }
  }, [theme, setTheme])

  const quickStartSteps = [
    {
      step: 1,
      title: "Login to Your Account",
      description: "Access the system using your credentials provided by your administrator.",
      icon: <Users className="w-6 h-6" />,
    },
    {
      step: 2,
      title: "Navigate to Dashboard",
      description: "View the main dashboard to get an overview of your fleet status and key metrics.",
      icon: <Play className="w-6 h-6" />,
    },
    {
      step: 3,
      title: "Explore Trainsets",
      description: "Browse through your trainset inventory, check status, and view detailed information.",
      icon: <Settings className="w-6 h-6" />,
    },
    {
      step: 4,
      title: "Manage Operations",
      description: "Use the planning tools to schedule maintenance, assign crews, and optimize routes.",
      icon: <CheckCircle className="w-6 h-6" />,
    },
  ]

  const faqs = [
    {
      question: "How do I upload a CSV template?",
      answer:
        "Navigate to the CSV Template page from the dashboard. Download the official template, fill it with your data, and upload it back. The system will validate the headers and data format before accepting the file.",
    },
    {
      question: "What happens if my CSV headers don't match?",
      answer:
        "The system performs strict header validation. If headers don't match exactly (including order, names, and case), you'll see a detailed error message showing missing columns, extra columns, or order mismatches. Fix these issues and re-upload.",
    },
    {
      question: "How do I reset my password?",
      answer:
        "Contact your system administrator to reset your password. For security reasons, password resets must be handled by authorized personnel.",
    },
    {
      question: "Can I export data from the system?",
      answer:
        "Yes, most data views include export functionality. Look for the download icon in tables and reports to export data in CSV or PDF format.",
    },
    {
      question: "How often is the data updated?",
      answer:
        "The system updates in real-time for most operations. Some analytics and reports may have a slight delay of 1-5 minutes depending on data complexity.",
    },
    {
      question: "What browsers are supported?",
      answer:
        "The system works best with modern browsers including Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.",
    },
    {
      question: "How do I report a bug or request a feature?",
      answer:
        "Use the feedback form in the system or contact your administrator. Include detailed steps to reproduce any issues and screenshots if applicable.",
    },
  ]

  const csvSteps = [
    {
      title: "Download Template",
      description: "Get the official CSV template with the correct headers and format.",
      icon: <Download className="w-5 h-5" />,
    },
    {
      title: "Edit Locally",
      description: "Open the template in Excel or Google Sheets and add your data.",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: "Validate Format",
      description: "Ensure headers match exactly and data follows the required format.",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      title: "Upload File",
      description: "Upload your completed CSV file through the web interface.",
      icon: <Upload className="w-5 h-5" />,
    },
  ]

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
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">Help & Documentation</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Everything you need to know to get started and make the most of your metro management system.
            </p>
          </div>

          {/* Quick Start Guide */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Quick Start Guide
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStartSteps.map((step, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        Step {step.step}
                      </Badge>
                      <div className="text-primary">{step.icon}</div>
                    </div>
                    <CardTitle className="text-lg font-semibold">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                  {index < quickStartSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>

          {/* CSV Template Guide */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              CSV Template Management
            </h2>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Important CSV Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Header Validation Rules
                      </h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        <li>• Headers must match exactly (case-sensitive)</li>
                        <li>• Column order must be preserved</li>
                        <li>• No extra or missing columns allowed</li>
                        <li>• Whitespace is automatically trimmed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {csvSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                      <div className="text-primary">{step.icon}</div>
                      <div>
                        <h4 className="font-medium text-sm">{step.title}</h4>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-primary" />
              Frequently Asked Questions
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Contact Support */}
          <section>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground mb-2">Need More Help?</CardTitle>
                <CardDescription className="text-lg">
                  Our support team is here to assist you with any questions or issues.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:support@kochimetro.com"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Contact Support
                  </a>
                  <a
                    href="/dashboard/csv-template"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border border-border bg-background text-foreground hover:bg-accent transition-colors"
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
