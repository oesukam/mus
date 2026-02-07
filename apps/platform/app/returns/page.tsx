import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-balance">Returns & Refunds Policy</h1>
      <p className="text-lg text-muted-foreground mb-8 text-pretty">
        We want you to be completely satisfied with your purchase. If you're not happy, we're here to help.
      </p>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>30-Day Return Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              You have 30 days from the date of delivery to return most items for a full refund. Items must be in their
              original condition, unworn, unused, and with all tags attached.
            </p>
            <div className="flex items-start gap-3 mt-4">
              <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <p>Free returns on all orders over $100</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <p>Easy return process with prepaid shipping labels</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <p>Refunds processed within 5-7 business days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Return an Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <ol className="list-decimal list-inside space-y-3 ml-4">
              <li>
                <strong className="text-foreground">Contact us</strong> - Email shop@muselemu.com with your order number
                and reason for return
              </li>
              <li>
                <strong className="text-foreground">Receive return label</strong> - We'll send you a prepaid return
                shipping label within 24 hours
              </li>
              <li>
                <strong className="text-foreground">Pack your item</strong> - Place the item in its original packaging
                with all tags attached
              </li>
              <li>
                <strong className="text-foreground">Ship it back</strong> - Drop off your package at any authorized
                shipping location
              </li>
              <li>
                <strong className="text-foreground">Get your refund</strong> - Once we receive and inspect your return,
                we'll process your refund
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Non-Returnable Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>The following items cannot be returned:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Gift cards</li>
              <li>Downloadable software or digital products</li>
              <li>Personal care items (for hygiene reasons)</li>
              <li>Items marked as final sale</li>
              <li>Custom or personalized items</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exchanges</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              We currently only offer refunds for returned items. If you need a different size or color, please place a
              new order and return the original item for a refund.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Damaged or Defective Items</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              If you receive a damaged or defective item, please contact us immediately at shop@muselemu.com with photos
              of the damage. We'll arrange for a replacement or full refund at no cost to you.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refund Processing</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Once your return is received and inspected, we'll send you an email notification. If approved, your refund
              will be processed to your original payment method within 5-7 business days. Please note that it may take
              additional time for your bank or credit card company to post the refund.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions?</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              If you have any questions about our returns policy, please contact our customer service team at{" "}
              <a href="mailto:shop@muselemu.com" className="text-foreground hover:underline">
                shop@muselemu.com
              </a>{" "}
              or call us at{" "}
              <a href="tel:+250788123456" className="text-foreground hover:underline">
                +250 788 123 456
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
