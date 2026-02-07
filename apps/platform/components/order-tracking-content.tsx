"use client"

import { useState, useEffect } from "react"
import { ordersApi, type Order, type OrderTimelineResponse } from "@/lib/orders-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export function OrderTrackingContent({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [timeline, setTimeline] = useState<OrderTimelineResponse["timeline"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrderAndTimeline() {
      try {
        setIsLoading(true)
        setError(null)
        // The getOrder and getOrderTimeline methods now accept both ID and order number
        const [{ order: fetchedOrder }, timelineData] = await Promise.all([
          ordersApi.getOrder(orderNumber as any),
          ordersApi.getOrderTimeline(orderNumber as any),
        ])
        setOrder(fetchedOrder)
        setTimeline(timelineData.timeline)
      } catch (err) {
        console.error("Failed to fetch order tracking:", err)
        setError("Failed to load order tracking information. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderAndTimeline()
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

  if (error || !order || !timeline) {
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
                <CardTitle className="text-2xl">Order Tracking</CardTitle>
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
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full sm:w-auto bg-transparent">
                <Link href={`/orders/${order.orderNumber}`}>View Order Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {order.deliveryStatus !== "CANCELLED" ? (
          <Card>
            <CardHeader>
              <CardTitle>Tracking Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((step, index) => {
                  const isCompleted = step.isCompleted
                  const isCurrent = step.isCurrent
                  return (
                    <div key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                            isCompleted
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted bg-background text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                          )}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className={`h-12 w-0.5 ${isCompleted ? "bg-primary" : "bg-muted"}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className={`font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {step.timestamp && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(step.timestamp).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        {step.notes && <p className="text-sm text-muted-foreground mt-1">{step.notes}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Order Cancelled</h3>
              <p className="text-muted-foreground">This order has been cancelled and will not be shipped.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
