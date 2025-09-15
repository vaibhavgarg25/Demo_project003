import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { HelpCircle, BookOpen, MessageCircle, Lightbulb } from "lucide-react"

const faqs = [
  {
    question: "What if a certificate expires mid-shift?",
    answer:
      "The system automatically flags expiring certificates 48 hours in advance and provides alternative train recommendations to maintain service continuity.",
  },
  {
    question: "How does the mileage balancing work?",
    answer:
      "Our algorithm analyzes historical usage patterns and distributes daily kilometers across the fleet to ensure even wear and optimal maintenance scheduling.",
  },
  {
    question: "Can I override system recommendations?",
    answer:
      "Yes, supervisors can override recommendations with proper authorization. All overrides are logged with reasoning for audit purposes.",
  },
  {
    question: "How accurate are the cleaning time estimates?",
    answer:
      "Cleaning estimates are based on train condition, passenger load data, and historical cleaning times, with 95% accuracy in time predictions.",
  },
]

export function HelpSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl mb-4">
              Need clarity? We've got you covered.
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Every recommendation comes with reasoning you can trust.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 mb-12">
            {/* FAQs Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </div>
                <CardDescription>Common questions about the fleet induction system</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-lg">Tutorials</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">Step-by-step guides for system onboarding</CardDescription>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    View Tutorials
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Contact Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">Get help from our operations desk</CardDescription>
                  <Button size="sm" className="w-full">
                    Contact Ops Desk
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-secondary/5 border-secondary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-lg">Explainable AI</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Every recommendation includes clear reasoning and data sources for full transparency.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
