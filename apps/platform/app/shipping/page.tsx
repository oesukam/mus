import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Package, Globe, Clock } from "lucide-react"

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-balance">Shipping Information</h1>
      <p className="text-lg text-muted-foreground mb-8 text-pretty">
        We offer fast, reliable shipping to ensure your order arrives safely and on time.
      </p>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Free Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>Free standard shipping on all orders over $100. No code needed, discount applied at checkout.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Fast Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>Orders placed before 2 PM EST are processed the same day. Weekend orders ship on Monday.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Secure Packaging
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>All items are carefully packaged to ensure they arrive in perfect condition.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Worldwide Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>We ship to over 100 countries worldwide with reliable international carriers.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Domestic Shipping (United States)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h4 className="font-semibold text-foreground">Standard Shipping</h4>
                  <p className="text-sm text-muted-foreground">5-7 business days</p>
                </div>
                <p className="font-semibold text-foreground">$9.99</p>
              </div>

              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h4 className="font-semibold text-foreground">Express Shipping</h4>
                  <p className="text-sm text-muted-foreground">2-3 business days</p>
                </div>
                <p className="font-semibold text-foreground">$19.99</p>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">Overnight Shipping</h4>
                  <p className="text-sm text-muted-foreground">1 business day</p>
                </div>
                <p className="font-semibold text-foreground">$34.99</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>International Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h4 className="font-semibold text-foreground">Canada</h4>
                  <p className="text-sm text-muted-foreground">7-10 business days</p>
                </div>
                <p className="font-semibold text-foreground">$19.99</p>
              </div>

              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h4 className="font-semibold text-foreground">Europe</h4>
                  <p className="text-sm text-muted-foreground">10-14 business days</p>
                </div>
                <p className="font-semibold text-foreground">$29.99</p>
              </div>

              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h4 className="font-semibold text-foreground">Asia & Pacific</h4>
                  <p className="text-sm text-muted-foreground">12-16 business days</p>
                </div>
                <p className="font-semibold text-foreground">$34.99</p>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">Rest of World</h4>
                  <p className="text-sm text-muted-foreground">14-21 business days</p>
                </div>
                <p className="font-semibold text-foreground">$39.99</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Tracking</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Once your order ships, you'll receive a confirmation email with a tracking number. You can track your
              package in real-time using the tracking link provided.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customs & Duties</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              For international orders, customs duties and taxes may apply depending on your country's regulations.
              These fees are the responsibility of the recipient and are not included in our shipping costs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Restrictions</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              We currently do not ship to P.O. boxes or military addresses (APO/FPO). All shipments require a signature
              upon delivery for orders over $500.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions About Shipping?</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              If you have any questions about shipping, please contact our customer service team at{" "}
              <a href="mailto:shop@muselemu.com" className="text-foreground hover:underline">
                shop@muselemu.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
