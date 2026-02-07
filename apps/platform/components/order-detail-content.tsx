"use client"

import { useState, useEffect } from "react"
import { ordersApi, type Order } from "@/lib/orders-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Truck, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatPrice } from "@/lib/currencies"
import { useCurrencyStore } from "@/lib/currency-store"

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  in_transit: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  out_for_delivery: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  failed_delivery: "bg-red-500/10 text-red-500 border-red-500/20",
  returned: "bg-orange-500/10 text-orange-500 border-orange-500/20",
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function OrderDetailContent({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currency = useCurrencyStore((state) => state.currency)

  useEffect(() => {
    async function fetchOrder() {
      try {
        setIsLoading(true)
        setError(null)
        // The getOrder method now accepts both ID and order number
        const { order: fetchedOrder } = await ordersApi.getOrder(orderNumber as any)
        setOrder(fetchedOrder)
      } catch (err) {
        console.error("Failed to fetch order:", err)
        setError("Failed to load order details. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Order not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const status = order.deliveryStatus.toLowerCase()

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Order Details</CardTitle>
                <p className="text-sm text-muted-foreground mt-1 font-mono">{order.orderNumber}</p>
              </div>
              <Badge className={statusColors[status] || statusColors.pending} variant="outline">
                {formatStatus(order.deliveryStatus)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-mono font-medium">{order.trackingNumber}</p>
                </div>
              )}
              {order.carrier && (
                <div>
                  <p className="text-sm text-muted-foreground">Carrier</p>
                  <p className="font-medium">{order.carrier}</p>
                </div>
              )}
              {order.estimatedDeliveryDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                  <p className="font-medium">
                    {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
            {order.trackingNumber && order.deliveryStatus !== "CANCELLED" && (
              <div className="mt-4">
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/orders/${order.orderNumber}/tracking`}>
                    <Truck className="mr-2 h-4 w-4" />
                    Track Order
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT</span>
                <span className="font-medium">{formatPrice(order.vatAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount, currency)}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
              <Badge variant={order.paymentStatus === "PAID" ? "default" : "secondary"}>
                {order.paymentStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-medium text-foreground">{order.recipientName}</p>
              <p className="text-muted-foreground">{order.recipientEmail}</p>
              {order.recipientPhone && <p className="text-muted-foreground">{order.recipientPhone}</p>}
              <div className="pt-2">
                <p className="text-muted-foreground">{order.shippingAddress}</p>
                <p className="text-muted-foreground">
                  {order.shippingCity}
                  {order.shippingState && `, ${order.shippingState}`}
                  {order.shippingZipCode && ` ${order.shippingZipCode}`}
                </p>
                <p className="text-muted-foreground">{order.shippingCountry}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.deliveryNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{order.deliveryNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
