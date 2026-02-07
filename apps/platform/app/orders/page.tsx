"use client"

import { useState, useEffect } from "react"
import { ordersApi, type Order } from "@/lib/orders-api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import Link from "next/link"
import Image from "next/image"
import { Package, ChevronRight, Loader2, AlertCircle } from "lucide-react"
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currency = useCurrencyStore((state) => state.currency)

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true)
        setError(null)
        const { orders: fetchedOrders } = await ordersApi.getUserOrders()
        setOrders(fetchedOrders)
      } catch (err) {
        console.error("Failed to fetch orders:", err)
        setError("Failed to load orders. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Orders</h1>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center py-20">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button asChild>
              <Link href="/search">Browse Products</Link>
            </Button>
          </div>
        )}

        {!isLoading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = order.deliveryStatus.toLowerCase()
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Order Number</p>
                        <p className="font-mono font-semibold text-foreground">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium text-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <Badge
                          className={statusColors[status] || statusColors.pending}
                          variant="outline"
                        >
                          {formatStatus(order.deliveryStatus)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-foreground">
                          {formatPrice(order.totalAmount, currency)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mb-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button asChild variant="outline" className="flex-1 bg-transparent">
                        <Link href={`/orders/${order.orderNumber}`}>
                          View Details
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      {order.trackingNumber && (
                        <Button asChild className="flex-1">
                          <Link href={`/orders/${order.orderNumber}/tracking`}>Track Order</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
