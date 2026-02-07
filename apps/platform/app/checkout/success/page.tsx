import Link from "next/link"
import { CheckCircle, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"

function SuccessContent({ orderNumber, email }: { orderNumber: string | null; email: string | null }) {
  // Create tracking URL with order number and email pre-filled
  const trackingUrl = orderNumber && email
    ? `/track-order?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
    : `/track-order${orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : ''}`

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <CheckCircle className="mx-auto h-20 w-20 text-green-600 dark:text-green-400 mb-6" />
        <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Order Confirmed!</h1>
        <p className="text-lg text-muted-foreground mb-8 text-pretty">
          Thank you for your purchase. We've sent a confirmation email with your order details.
        </p>

        {orderNumber && (
          <Card className="mb-8 bg-muted/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground">Order Number</h2>
              </div>
              <p className="text-2xl font-mono font-bold text-foreground">{orderNumber}</p>
              <p className="text-sm text-muted-foreground mt-4">
                Save this number for tracking your order
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={trackingUrl}>Track This Order</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/orders">View My Orders</Link>
          </Button>
        </div>

        <div className="mt-12 text-left max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-foreground mb-4">What happens next?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">✓</span>
              <span>You'll receive an order confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">✓</span>
              <span>We'll send you tracking information once your order ships</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">✓</span>
              <span>You can track your order status in the Orders section</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; orderId?: string; email?: string }>
}) {
  const params = await searchParams
  // Support both orderNumber (new) and orderId (legacy) parameters
  const orderNumber = params.orderNumber || params.orderId || null
  const email = params.email || null

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent orderNumber={orderNumber} email={email} />
    </Suspense>
  )
}
