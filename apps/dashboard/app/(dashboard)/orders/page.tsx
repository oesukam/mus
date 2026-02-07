"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  MoreHorizontal,
  Eye,
  Truck,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
} from "lucide-react"
import {
  ordersApi,
  Order,
  DeliveryStatus,
  PaymentStatus,
  PaymentMethod,
  ChangeDeliveryStatusDto,
  MarkOrderAsPaidDto,
} from "@/lib/orders-api"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { DataTable, ColumnDef, FilterDef } from "@/components/data-table"

const CARRIER_OPTIONS = [
  { value: "Internal", label: "Internal" },
  { value: "DHL", label: "DHL" },
  { value: "FedEx", label: "FedEx" },
  { value: "UPS", label: "UPS" },
  { value: "Post Office", label: "Post Office" },
]

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState({
    deliveryStatus: "all",
    paymentStatus: "all",
  })
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [isQuickStatusDialogOpen, setIsQuickStatusDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quickStatusTarget, setQuickStatusTarget] = useState<DeliveryStatus | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Status update form
  const [newStatus, setNewStatus] = useState<DeliveryStatus>(DeliveryStatus.PENDING)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("")
  const [statusNotes, setStatusNotes] = useState("")

  // Payment form
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH)
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  // Delivery notes
  const [deliveryNotes, setDeliveryNotes] = useState("")

  // Fetch orders
  useEffect(() => {
    fetchOrders()
  }, [currentPage, filterValues.deliveryStatus, itemsPerPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let response

      if (filterValues.deliveryStatus !== "all") {
        response = await ordersApi.getOrdersByStatus(filterValues.deliveryStatus as DeliveryStatus, {
          page: currentPage,
          limit: itemsPerPage,
        })
      } else {
        response = await ordersApi.getOrders({
          page: currentPage,
          limit: itemsPerPage,
        })
      }

      setOrders(response.orders)
      setTotalPages(response.pagination.totalPages)
      setTotalOrders(response.pagination.total)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchOrders()
      return
    }

    try {
      setLoading(true)
      const response = await ordersApi.getOrderByNumber(searchQuery)
      setOrders([response.order])
      setTotalPages(1)
      setTotalOrders(1)
    } catch (error) {
      console.error("Search failed:", error)
      toast({
        title: "Error",
        description: "Order not found",
        variant: "destructive",
      })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return

    try {
      setIsSubmitting(true)
      const data: ChangeDeliveryStatusDto = {
        deliveryStatus: newStatus,
        notes: statusNotes || undefined,
      }

      if (trackingNumber) data.trackingNumber = trackingNumber
      if (carrier) data.carrier = carrier
      if (estimatedDeliveryDate) data.estimatedDeliveryDate = estimatedDeliveryDate

      await ordersApi.updateDeliveryStatus(selectedOrder.id, data)

      // Update the order in the local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrder.id
            ? {
                ...order,
                deliveryStatus: newStatus,
                trackingNumber: trackingNumber || order.trackingNumber,
                carrier: carrier || order.carrier,
                estimatedDeliveryDate: estimatedDeliveryDate || order.estimatedDeliveryDate,
                deliveryNotes: statusNotes || order.deliveryNotes,
              }
            : order
        )
      )

      toast({
        title: "Success",
        description: "Order status updated successfully",
      })
      setIsStatusDialogOpen(false)
      resetStatusForm()

      // Fetch latest data in background to ensure consistency
      fetchOrders()
    } catch (error: any) {
      console.error("Failed to update status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!selectedOrder) return

    try {
      setIsSubmitting(true)
      const data: MarkOrderAsPaidDto = {
        paymentMethod,
        paymentReference: paymentReference || undefined,
        paymentNotes: paymentNotes || undefined,
      }

      const result = await ordersApi.markOrderAsPaid(selectedOrder.id, data)

      // Update the order in the local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrder.id
            ? {
                ...order,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: data.paymentMethod,
                paymentReference: data.paymentReference,
                paymentNotes: data.paymentNotes,
                paidAt: new Date().toISOString(),
              }
            : order
        )
      )

      toast({
        title: "Success",
        description: "Order marked as paid successfully. Confirmation email sent to customer.",
      })
      setIsPaymentDialogOpen(false)
      resetPaymentForm()

      // Fetch latest data in background to ensure consistency
      fetchOrders()
    } catch (error: any) {
      console.error("Failed to mark as paid:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to mark order as paid",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddNotes = async () => {
    if (!selectedOrder || !deliveryNotes.trim()) return

    try {
      setIsSubmitting(true)
      await ordersApi.addDeliveryNotes(selectedOrder.id, deliveryNotes)

      // Update the order in the local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrder.id
            ? { ...order, deliveryNotes }
            : order
        )
      )

      toast({
        title: "Success",
        description: "Delivery notes added successfully",
      })
      setIsNotesDialogOpen(false)
      setDeliveryNotes("")

      // Fetch latest data in background to ensure consistency
      fetchOrders()
    } catch (error: any) {
      console.error("Failed to add notes:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add delivery notes",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickStatusUpdate = async () => {
    if (!selectedOrder || !quickStatusTarget) return

    try {
      setIsSubmitting(true)
      const data: ChangeDeliveryStatusDto = {
        deliveryStatus: quickStatusTarget,
        notes: statusNotes || undefined,
      }

      if (trackingNumber) data.trackingNumber = trackingNumber
      if (carrier) data.carrier = carrier
      if (estimatedDeliveryDate) data.estimatedDeliveryDate = estimatedDeliveryDate

      await ordersApi.updateDeliveryStatus(selectedOrder.id, data)

      // Update the order in the local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrder.id
            ? {
                ...order,
                deliveryStatus: quickStatusTarget,
                trackingNumber: trackingNumber || order.trackingNumber,
                carrier: carrier || order.carrier,
                estimatedDeliveryDate: estimatedDeliveryDate || order.estimatedDeliveryDate,
                deliveryNotes: statusNotes || order.deliveryNotes,
              }
            : order
        )
      )

      toast({
        title: "Success",
        description: `Order marked as ${getStatusLabel(quickStatusTarget)}`,
      })
      setIsQuickStatusDialogOpen(false)
      resetStatusForm()
      setQuickStatusTarget(null)

      // Fetch latest data in background to ensure consistency
      fetchOrders()
    } catch (error: any) {
      console.error("Failed to update status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openQuickStatusDialog = (order: Order, status: DeliveryStatus) => {
    setSelectedOrder(order)
    setQuickStatusTarget(status)
    setNewStatus(status)
    setIsQuickStatusDialogOpen(true)
  }

  const resetStatusForm = () => {
    setNewStatus(DeliveryStatus.PENDING)
    setTrackingNumber("")
    setCarrier("")
    setEstimatedDeliveryDate("")
    setStatusNotes("")
  }

  const resetPaymentForm = () => {
    setPaymentMethod(PaymentMethod.CASH)
    setPaymentReference("")
    setPaymentNotes("")
  }

  // Filter orders locally by payment status
  const filteredOrders = orders.filter((order) => {
    if (filterValues.paymentStatus === "all") return true
    return order.paymentStatus === filterValues.paymentStatus
  })

  const getStatusBadgeColor = (status: DeliveryStatus): string => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300"
      case DeliveryStatus.PROCESSING:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300"
      case DeliveryStatus.SHIPPED:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300"
      case DeliveryStatus.IN_TRANSIT:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-300"
      case DeliveryStatus.OUT_FOR_DELIVERY:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300"
      case DeliveryStatus.DELIVERED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300"
      case DeliveryStatus.FAILED_DELIVERY:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300"
      case DeliveryStatus.RETURNED:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300"
      case DeliveryStatus.CANCELLED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300"
    }
  }

  const getPaymentBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return "default"
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
        return "destructive"
      case PaymentStatus.PENDING:
        return "secondary"
      case PaymentStatus.REFUNDED:
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Cash',
      [PaymentMethod.CREDIT_CARD]: 'Credit Card',
      [PaymentMethod.DEBIT_CARD]: 'Debit Card',
      [PaymentMethod.MOBILE_MONEY]: 'Mobile Money',
      [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
      [PaymentMethod.OTHER]: 'Other',
    }
    return labels[method] || method
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate order statistics
  const pendingOrders = orders.filter((o) => o.deliveryStatus === DeliveryStatus.PENDING).length
  const processingOrders = orders.filter((o) => o.deliveryStatus === DeliveryStatus.PROCESSING).length
  const shippedOrders = orders.filter((o) =>
    [DeliveryStatus.SHIPPED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY].includes(o.deliveryStatus)
  ).length
  const deliveredOrders = orders.filter((o) => o.deliveryStatus === DeliveryStatus.DELIVERED).length

  // Column definitions
  const columns: ColumnDef<Order>[] = [
    {
      key: "orderNumber",
      header: "Order Number",
      sortable: false,
      cell: (order) => <span className="font-medium font-mono text-sm">{order.orderNumber}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortable: false,
      cell: (order) => (
        <span>
          {order.user?.firstName && order.user?.lastName
            ? `${order.user.firstName} ${order.user.lastName}`
            : order.user?.email || "N/A"}
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      sortable: false,
      cell: (order) => <span>{order.items.length} item(s)</span>,
    },
    {
      key: "totalAmount",
      header: "Total",
      sortable: false,
      cell: (order) => <span>{formatPrice(order.totalAmount, "RWF")}</span>,
    },
    {
      key: "paymentStatus",
      header: "Payment",
      sortable: false,
      cell: (order) => (
        <Badge variant={getPaymentBadgeVariant(order.paymentStatus)}>
          {getStatusLabel(order.paymentStatus)}
        </Badge>
      ),
    },
    {
      key: "deliveryStatus",
      header: "Delivery Status",
      sortable: false,
      cell: (order) => (
        <Badge className={`${getStatusBadgeColor(order.deliveryStatus)} border`}>
          {getStatusLabel(order.deliveryStatus)}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: false,
      cell: (order) => <span>{formatDate(order.createdAt)}</span>,
    },
  ]

  // Filter definitions
  const filters: FilterDef[] = [
    {
      key: "deliveryStatus",
      label: "Delivery Status",
      placeholder: "All Statuses",
      options: [
        { value: "all", label: "All Statuses" },
        ...Object.values(DeliveryStatus).map((status) => ({
          value: status,
          label: getStatusLabel(status),
        })),
      ],
    },
    {
      key: "paymentStatus",
      label: "Payment Status",
      placeholder: "All Payments",
      options: [
        { value: "all", label: "All Payments" },
        ...Object.values(PaymentStatus).map((status) => ({
          value: status,
          label: getStatusLabel(status),
        })),
      ],
    },
  ]

  // Filter change handler
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  // Actions renderer
  const renderActions = (order: Order) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setSelectedOrder(order)
            setIsViewDialogOpen(true)
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedOrder(order)
            setNewStatus(order.deliveryStatus)
            setIsStatusDialogOpen(true)
          }}
        >
          <Truck className="mr-2 h-4 w-4" />
          Update Status
        </DropdownMenuItem>
        {order.paymentStatus !== PaymentStatus.PAID && (
          <DropdownMenuItem
            onClick={() => {
              setSelectedOrder(order)
              setIsPaymentDialogOpen(true)
            }}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Mark as Paid
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            setSelectedOrder(order)
            setDeliveryNotes(order.deliveryNotes || "")
            setIsNotesDialogOpen(true)
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Add Notes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Quick Status Updates</DropdownMenuLabel>
        {order.deliveryStatus !== DeliveryStatus.PROCESSING && (
          <DropdownMenuItem onClick={() => openQuickStatusDialog(order, DeliveryStatus.PROCESSING)}>
            <Clock className="mr-2 h-4 w-4" />
            Mark as Processing
          </DropdownMenuItem>
        )}
        {order.deliveryStatus !== DeliveryStatus.SHIPPED && (
          <DropdownMenuItem onClick={() => openQuickStatusDialog(order, DeliveryStatus.SHIPPED)}>
            <Package className="mr-2 h-4 w-4" />
            Mark as Shipped
          </DropdownMenuItem>
        )}
        {order.deliveryStatus !== DeliveryStatus.OUT_FOR_DELIVERY && (
          <DropdownMenuItem onClick={() => openQuickStatusDialog(order, DeliveryStatus.OUT_FOR_DELIVERY)}>
            <Truck className="mr-2 h-4 w-4" />
            Mark as Out for Delivery
          </DropdownMenuItem>
        )}
        {order.deliveryStatus !== DeliveryStatus.DELIVERED && (
          <DropdownMenuItem onClick={() => openQuickStatusDialog(order, DeliveryStatus.DELIVERED)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark as Delivered
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders + processingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippedOrders}</div>
            <p className="text-xs text-muted-foreground">Out for delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>View and manage all customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredOrders}
            columns={columns}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size)
              setCurrentPage(1)
            }}
            filters={filters}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            emptyMessage="No orders found"
            loadingMessage="Loading orders..."
            actions={renderActions}
          />
        </CardContent>
      </Card>

      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete order information and status history
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Order Number</Label>
                  <p className="font-mono font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Order Date</Label>
                  <p className="font-semibold">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Customer</Label>
                  <p className="font-semibold">
                    {selectedOrder.user?.firstName && selectedOrder.user?.lastName
                      ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}`
                      : selectedOrder.user?.email || "Guest"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Customer Email</Label>
                  <p className="font-semibold">{selectedOrder.user?.email || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Payment Status</Label>
                  <Badge variant={getPaymentBadgeVariant(selectedOrder.paymentStatus)}>
                    {getStatusLabel(selectedOrder.paymentStatus)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Delivery Status</Label>
                  <Badge className={`${getStatusBadgeColor(selectedOrder.deliveryStatus)} border`}>
                    {getStatusLabel(selectedOrder.deliveryStatus)}
                  </Badge>
                </div>
              </div>

              {selectedOrder.paymentMethod && (
                <div>
                  <Label className="text-sm text-muted-foreground">Payment Method</Label>
                  <p className="font-semibold">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</p>
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div>
                  <Label className="text-sm text-muted-foreground">Tracking Number</Label>
                  <p className="font-mono font-semibold">{selectedOrder.trackingNumber}</p>
                </div>
              )}

              {selectedOrder.carrier && (
                <div>
                  <Label className="text-sm text-muted-foreground">Carrier</Label>
                  <p className="font-semibold">{selectedOrder.carrier}</p>
                </div>
              )}

              <div>
                <Label className="text-sm text-muted-foreground mb-2">Order Items</Label>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-2 bg-muted rounded-md">
                      <span>Product ID: {item.productId}</span>
                      <span>Qty: {item.quantity}</span>
                      <span>{formatPrice(item.price, "RWF")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(selectedOrder.subtotal, "RWF")}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT:</span>
                  <span>{formatPrice(selectedOrder.vatAmount, "RWF")}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatPrice(selectedOrder.totalAmount, "RWF")}</span>
                </div>
              </div>

              {selectedOrder.deliveryNotes && (
                <div>
                  <Label className="text-sm text-muted-foreground">Delivery Notes</Label>
                  <p className="text-sm mt-1">{selectedOrder.deliveryNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Delivery Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
            <DialogDescription>
              Update the delivery status and tracking information for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Delivery Status *</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as DeliveryStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DeliveryStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger id="carrier">
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  {CARRIER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</Label>
              <Input
                id="estimatedDeliveryDate"
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusNotes">Notes</Label>
              <Textarea
                id="statusNotes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any relevant notes about this status update"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Paid</DialogTitle>
            <DialogDescription>
              Record payment details for this order. A confirmation email will be sent to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentMethod).map((method) => (
                    <SelectItem key={method} value={method}>
                      {getPaymentMethodLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentReference">Payment Reference</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID, receipt number, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Payment Notes</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any relevant payment details or notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Mark as Paid"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Delivery Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Delivery Notes</DialogTitle>
            <DialogDescription>
              Add or update delivery notes for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Delivery Notes</Label>
              <Textarea
                id="deliveryNotes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Enter delivery notes..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddNotes} disabled={isSubmitting || !deliveryNotes.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Notes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Status Update Dialog */}
      <Dialog open={isQuickStatusDialogOpen} onOpenChange={setIsQuickStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {quickStatusTarget && `Mark as ${getStatusLabel(quickStatusTarget)}`}
            </DialogTitle>
            <DialogDescription>
              Quickly update the order status with optional tracking details and notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(quickStatusTarget === DeliveryStatus.SHIPPED ||
              quickStatusTarget === DeliveryStatus.OUT_FOR_DELIVERY) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quickTrackingNumber">Tracking Number</Label>
                  <Input
                    id="quickTrackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quickCarrier">Carrier</Label>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger id="quickCarrier">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARRIER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="quickStatusNotes">Notes (Optional)</Label>
              <Textarea
                id="quickStatusNotes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any relevant notes about this status update"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickStatusDialogOpen(false)
                resetStatusForm()
                setQuickStatusTarget(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleQuickStatusUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                `Mark as ${quickStatusTarget ? getStatusLabel(quickStatusTarget) : 'Updated'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
