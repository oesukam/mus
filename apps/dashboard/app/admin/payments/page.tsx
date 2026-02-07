"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Search, MoreHorizontal, Eye, CreditCard, DollarSign, AlertCircle, RefreshCw } from "lucide-react"
import { format } from "date-fns"

type PaymentStatus = "completed" | "pending" | "failed" | "refunded" | "partially-refunded"
type PaymentMethod = "credit-card" | "debit-card" | "paypal" | "bank-transfer"

type Payment = {
  id: number
  transactionId: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  amount: number
  refundedAmount: number
  method: PaymentMethod
  status: PaymentStatus
  date: Date
  cardLast4?: string
  notes: string
}

const initialPayments: Payment[] = [
  {
    id: 1,
    transactionId: "TXN-2024-001",
    orderNumber: "ORD-2024-001",
    customer: { name: "Sarah Johnson", email: "sarah@example.com" },
    amount: 114.97,
    refundedAmount: 0,
    method: "credit-card",
    status: "completed",
    date: new Date(2024, 0, 15),
    cardLast4: "4242",
    notes: "Payment successful",
  },
  {
    id: 2,
    transactionId: "TXN-2024-002",
    orderNumber: "ORD-2024-002",
    customer: { name: "Mike Chen", email: "mike@example.com" },
    amount: 199.99,
    refundedAmount: 0,
    method: "paypal",
    status: "completed",
    date: new Date(2024, 0, 18),
    notes: "Payment successful",
  },
  {
    id: 3,
    transactionId: "TXN-2024-003",
    orderNumber: "ORD-2024-003",
    customer: { name: "Emma Davis", email: "emma@example.com" },
    amount: 64.98,
    refundedAmount: 0,
    method: "debit-card",
    status: "completed",
    date: new Date(2024, 0, 20),
    cardLast4: "5555",
    notes: "Payment successful",
  },
  {
    id: 4,
    transactionId: "TXN-2024-004",
    orderNumber: "ORD-2024-004",
    customer: { name: "James Wilson", email: "james@example.com" },
    amount: 79.99,
    refundedAmount: 0,
    method: "credit-card",
    status: "pending",
    date: new Date(2024, 0, 22),
    cardLast4: "1234",
    notes: "Payment processing",
  },
  {
    id: 5,
    transactionId: "TXN-2024-005",
    orderNumber: "ORD-2024-005",
    customer: { name: "Lisa Anderson", email: "lisa@example.com" },
    amount: 74.97,
    refundedAmount: 74.97,
    method: "credit-card",
    status: "refunded",
    date: new Date(2024, 0, 19),
    cardLast4: "9876",
    notes: "Full refund issued",
  },
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter
    return matchesSearch && matchesStatus && matchesMethod
  })

  // Process refund
  const processRefund = () => {
    if (!selectedPayment || !refundAmount) return
    const amount = Number.parseFloat(refundAmount)
    const totalRefunded = selectedPayment.refundedAmount + amount

    setPayments(
      payments.map((payment) =>
        payment.id === selectedPayment.id
          ? {
              ...payment,
              refundedAmount: totalRefunded,
              status: totalRefunded >= payment.amount ? "refunded" : "partially-refunded",
              notes: `Refund of $${amount.toFixed(2)} issued. Reason: ${refundReason}`,
            }
          : payment,
      ),
    )
    setIsRefundDialogOpen(false)
    setRefundAmount("")
    setRefundReason("")
  }

  // View payment details
  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailsOpen(true)
  }

  // Open refund dialog
  const openRefundDialog = (payment: Payment) => {
    setSelectedPayment(payment)
    setRefundAmount((payment.amount - payment.refundedAmount).toFixed(2))
    setIsRefundDialogOpen(true)
  }

  // Get status badge variant
  const getStatusVariant = (status: PaymentStatus) => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      case "refunded":
        return "outline"
      case "partially-refunded":
        return "outline"
      default:
        return "outline"
    }
  }

  // Get payment method display name
  const getMethodName = (method: PaymentMethod) => {
    switch (method) {
      case "credit-card":
        return "Credit Card"
      case "debit-card":
        return "Debit Card"
      case "paypal":
        return "PayPal"
      case "bank-transfer":
        return "Bank Transfer"
      default:
        return method
    }
  }

  // Calculate stats
  const totalRevenue = payments
    .filter((p) => p.status === "completed" || p.status === "partially-refunded")
    .reduce((sum, p) => sum + (p.amount - p.refundedAmount), 0)
  const pendingPayments = payments.filter((p) => p.status === "pending").length
  const totalRefunds = payments.reduce((sum, p) => sum + p.refundedAmount, 0)
  const failedPayments = payments.filter((p) => p.status === "failed").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Payments</h1>
        <p className="text-muted-foreground">Manage transactions and refunds</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Net after refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Processing payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRefunds.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Refunded to customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPayments}</div>
            <p className="text-xs text-muted-foreground">Failed transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>View and manage all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="partially-refunded">Partially Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="credit-card">Credit Card</SelectItem>
                  <SelectItem value="debit-card">Debit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.transactionId}</div>
                        <div className="text-xs text-muted-foreground">{payment.orderNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{payment.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{payment.customer.email}</div>
                      </TableCell>
                      <TableCell>{format(payment.date, "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <div>{getMethodName(payment.method)}</div>
                        {payment.cardLast4 && (
                          <div className="text-xs text-muted-foreground">****{payment.cardLast4}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${payment.amount.toFixed(2)}</div>
                        {payment.refundedAmount > 0 && (
                          <div className="text-xs text-destructive">-${payment.refundedAmount.toFixed(2)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(payment.status)}>{payment.status.replace("-", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewPaymentDetails(payment)}>
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {(payment.status === "completed" || payment.status === "partially-refunded") &&
                              payment.refundedAmount < payment.amount && (
                                <DropdownMenuItem onClick={() => openRefundDialog(payment)}>
                                  <RefreshCw className="h-4 w-4" />
                                  Issue Refund
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Complete information about this transaction</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Transaction Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-medium">{selectedPayment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Number:</span>
                      <span className="font-medium">{selectedPayment.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{format(selectedPayment.date, "MMM dd, yyyy HH:mm")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusVariant(selectedPayment.status)}>
                        {selectedPayment.status.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedPayment.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedPayment.customer.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold mb-2">Payment Method</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <span>{getMethodName(selectedPayment.method)}</span>
                  </div>
                  {selectedPayment.cardLast4 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Card:</span>
                      <span>****{selectedPayment.cardLast4}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Amount Details */}
              <div>
                <h3 className="font-semibold mb-2">Amount Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Amount:</span>
                    <span className="font-medium">${selectedPayment.amount.toFixed(2)}</span>
                  </div>
                  {selectedPayment.refundedAmount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Refunded:</span>
                        <span className="text-destructive">-${selectedPayment.refundedAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-semibold">
                        <span>Net Amount:</span>
                        <span>${(selectedPayment.amount - selectedPayment.refundedAmount).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{selectedPayment.notes}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <AlertDialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Process a refund for this transaction. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="refund-amount">Refund Amount</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  max={selectedPayment.amount - selectedPayment.refundedAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum refundable: ${(selectedPayment.amount - selectedPayment.refundedAmount).toFixed(2)}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="refund-reason">Reason for Refund</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={processRefund} disabled={!refundAmount || !refundReason}>
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
