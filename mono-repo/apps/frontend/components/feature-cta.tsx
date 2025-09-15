import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Phone, Mail } from "lucide-react"

export function FeatureCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Ready to Transform Your Fleet?</h2>
            <p className="text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
              Join hundreds of transit operators who trust our platform to manage their fleets efficiently. Start your
              free trial today or speak with our experts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                Schedule Demo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +91 484 2345 678
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                sales@kochimetro.com
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
