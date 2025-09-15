import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, Search } from "lucide-react"

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create my first fleet in the system?",
        answer:
          "To create your first fleet, navigate to the Fleet Management section from your dashboard. Click 'Add New Fleet', enter your fleet details including name, type, and operational area. You can then add individual vehicles by clicking 'Add Vehicle' and entering vehicle specifications, registration numbers, and operational parameters.",
      },
      {
        question: "What information do I need to set up vehicle tracking?",
        answer:
          "For vehicle tracking setup, you'll need vehicle registration numbers, GPS device IDs (if applicable), driver assignments, route information, and operational schedules. The system will guide you through connecting GPS devices and configuring real-time monitoring parameters.",
      },
      {
        question: "How long does it take to fully set up the system?",
        answer:
          "Basic setup typically takes 15-30 minutes for a small fleet. This includes account creation, adding vehicles, and configuring basic monitoring. Advanced features like predictive maintenance and custom analytics may require additional configuration time depending on your specific requirements.",
      },
    ],
  },
  {
    category: "Features & Functionality",
    questions: [
      {
        question: "How does predictive maintenance work?",
        answer:
          "Our predictive maintenance system uses AI algorithms to analyze vehicle usage patterns, performance metrics, and historical maintenance data. It predicts potential issues before they occur, automatically schedules maintenance appointments, and sends alerts to prevent unexpected breakdowns.",
      },
      {
        question: "Can I customize the dashboard layout?",
        answer:
          "Yes, the dashboard is fully customizable. You can drag and drop widgets, resize panels, add or remove data visualizations, and create custom views for different user roles. Changes are saved automatically and sync across all your devices.",
      },
      {
        question: "What types of reports can I generate?",
        answer:
          "You can generate various reports including fleet utilization, maintenance costs, driver performance, fuel efficiency, safety incidents, route optimization, and custom analytics reports. All reports can be scheduled for automatic delivery and exported in multiple formats.",
      },
    ],
  },
  {
    category: "Technical Support",
    questions: [
      {
        question: "What browsers are supported?",
        answer:
          "The platform supports all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for optimal performance. Mobile browsers are also fully supported for on-the-go access.",
      },
      {
        question: "Is there a mobile app available?",
        answer:
          "Yes, we offer native mobile apps for both iOS and Android devices. The mobile app provides full functionality including real-time monitoring, alert management, basic reporting, and emergency response features. Download links are available in your account dashboard.",
      },
      {
        question: "How do I integrate with existing systems?",
        answer:
          "We provide REST APIs and webhooks for seamless integration with existing systems. Our technical team can assist with custom integrations for ERP systems, HR platforms, and other operational tools. Documentation and integration guides are available in the developer section.",
      },
    ],
  },
  {
    category: "Billing & Plans",
    questions: [
      {
        question: "What's included in the free trial?",
        answer:
          "The 30-day free trial includes access to all Professional plan features for up to 10 vehicles. This includes real-time tracking, basic analytics, maintenance scheduling, and email support. No credit card is required to start your trial.",
      },
      {
        question: "Can I change my plan anytime?",
        answer:
          "Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately for upgrades, while downgrades take effect at the next billing cycle. You'll receive prorated billing adjustments automatically.",
      },
      {
        question: "Do you offer custom enterprise pricing?",
        answer:
          "Yes, we offer custom pricing for large-scale deployments with 100+ vehicles. Enterprise plans include dedicated support, custom integrations, advanced analytics, and flexible deployment options. Contact our sales team for a personalized quote.",
      },
    ],
  },
]

export function HelpFAQ() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
            Find quick answers to common questions about our fleet management platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {faqCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="h-fit">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                  <Badge variant="secondary">{category.questions.length} questions</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                      <AccordionTrigger className="text-left text-sm font-medium hover:text-primary">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Can't find what you're looking for? Our support team is here to help you get the most out of your fleet
                management system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contact Support
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                  <Search className="mr-2 h-5 w-5" />
                  Search Help Articles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
