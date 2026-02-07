"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Package, Search, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ordersApi, type TrackOrderResponse, DeliveryStatus } from "@/lib/orders-api"
import { formatPrice } from "@/lib/currencies"

const trackOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
})

type TrackOrderForm = z.infer<typeof trackOrderSchema>

const statusLabels: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: "Order Placed",
  [DeliveryStatus.PROCESSING]: "Processing",
  [DeliveryStatus.SHIPPED]: "Shipped",
  [DeliveryStatus.IN_TRANSIT]: "In Transit",
  [DeliveryStatus.OUT_FOR_DELIVERY]: "Out for Delivery",
  [DeliveryStatus.DELIVERED]: "Delivered",
  [DeliveryStatus.FAILED_DELIVERY]: "Delivery Failed",
  [DeliveryStatus.RETURNED]: "Returned",
  [DeliveryStatus.CANCELLED]: "Cancelled",
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [trackingResult, setTrackingResult] = useState<TrackOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoPopulated, setIsAutoPopulated] = useState(false)
  const hasAutoTracked = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TrackOrderForm>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: {
      orderNumber: "",
      email: "",
      phone: "",
    },
  })

  // Auto-populate form from URL query parameters and optionally auto-track
  useEffect(() => {
    const orderNumber = searchParams.get("orderNumber")
    const email = searchParams.get("email")
    const phone = searchParams.get("phone")

    if (orderNumber || email || phone) {
      setIsAutoPopulated(true)
    }

    if (orderNumber) {
      setValue("orderNumber", orderNumber)
    }
    if (email) {
      setValue("email", email)
    }
    if (phone) {
      setValue("phone", phone)
    }

    // Auto-track if we have order number and at least one verification method
    if (orderNumber && (email || phone) && !hasAutoTracked.current) {
      hasAutoTracked.current = true
      onSubmit({
        orderNumber,
        email: email || "",
        phone: phone || "",
      })
    }
  }, [searchParams, setValue])

  const onSubmit = async (data: TrackOrderForm) => {
    setIsLoading(true)
    setError(null)
    setTrackingResult(null)

    try {
      const result = await ordersApi.trackOrder({
        orderNumber: data.orderNumber,
        email: data.email || undefined,
        phone: data.phone || undefined,
      })
      setTrackingResult(result)

      // Update URL with tracking parameters to persist data on refresh
      const params = new URLSearchParams()
      params.set("orderNumber", data.orderNumber)
      if (data.email) {
        params.set("email", data.email)
      }
      if (data.phone) {
        params.set("phone", data.phone)
      }

      // Update URL without triggering a full page reload
      router.replace(`/track-order?${params.toString()}`, { scroll: false })
    } catch (err: any) {
      setError(err.message || "Unable to find order. Please check your details and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order number and email or phone to view your order status
          </p>
        </div>

        {/* Tracking Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>
              Please provide your order number and the email or phone number used during checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="orderNumber">Order Number *</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g., RW2511-0000001"
                  {...register("orderNumber")}
                  className="font-mono"
                />
                {errors.orderNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.orderNumber.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+250788123456"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                * Provide either email or phone number (or both) for verification
              </p>

              {isAutoPopulated && !trackingResult && !error && (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    Order tracking details have been loaded from your link. Click "Track Order" to search or the form has been auto-submitted.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingResult && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-mono font-semibold">{trackingResult.order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-semibold">
                      {new Date(trackingResult.order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-lg">
                      {formatPrice(Number(trackingResult.order.totalAmount), 'RWF')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <p className="font-semibold capitalize">
                      {trackingResult.order.paymentStatus.toLowerCase()}
                    </p>
                  </div>
                </div>

                {trackingResult.order.trackingNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-mono font-semibold">{trackingResult.order.trackingNumber}</p>
                  </div>
                )}

                {trackingResult.order.carrier && (
                  <div>
                    <p className="text-sm text-muted-foreground">Carrier</p>
                    <p className="font-semibold">{trackingResult.order.carrier}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
                <CardDescription>
                  Current Status:{" "}
                  <span className="font-semibold">
                    {statusLabels[trackingResult.order.deliveryStatus]}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {trackingResult.timeline.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Connection Line */}
                      {index < trackingResult.timeline.length - 1 && (
                        <div
                          className={`absolute left-5 top-12 w-0.5 h-16 ${
                            step.isCompleted ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}

                      {/* Timeline Step */}
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                            step.isCompleted
                              ? "border-primary bg-primary text-primary-foreground"
                              : step.isCurrent
                                ? "border-primary bg-background text-primary"
                                : "border-muted bg-muted text-muted-foreground"
                          }`}
                        >
                          {step.isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-1 pt-1">
                          <p className="font-semibold">{step.label}</p>
                          {step.timestamp && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(step.timestamp).toLocaleString()}
                            </p>
                          )}
                          {step.notes && (
                            <p className="text-sm text-muted-foreground">{step.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">{trackingResult.order.recipientName}</p>
                  <p className="text-muted-foreground">{trackingResult.order.shippingAddress}</p>
                  <p className="text-muted-foreground">
                    {trackingResult.order.shippingCity}
                    {trackingResult.order.shippingState && `, ${trackingResult.order.shippingState}`}
                    {trackingResult.order.shippingZipCode && ` ${trackingResult.order.shippingZipCode}`}
                  </p>
                  <p className="text-muted-foreground">{trackingResult.order.shippingCountry}</p>
                  {trackingResult.order.recipientPhone && (
                    <p className="text-muted-foreground">{trackingResult.order.recipientPhone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">Loading...</h2>
        </div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  )
}
