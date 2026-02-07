"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Separator } from "@/components/ui/separator"
import { Truck, Search, MoreHorizontal, Eye, MapPin, Clock, CheckCircle2 } from "lucide-react"

type Delivery = {
  id: number
  orderId: number
  customer: string
  address: string
  driver: string | null
  status: "pending" | "assigned" | "in-transit" | "delivered" | "failed"
  date: string
}

const initialDeliveries: Delivery[] = [
  {
    id: 501,
    orderId: 1005,
    customer: "Sarah Johnson",
    address: "123 Main St, New York, NY",
    driver: "John Driver",
    status: "delivered",
    date: "2024-01-15",
  },
  {
    id: 502,
    orderId: 1004,
    customer: "Mike Chen",
    address: "456 Oak Ave, Los Angeles, CA",
    driver: "Jane Smith",
    status: "in-transit",
    date: "2024-01-15",
  },
  {
    id: 503,
    orderId: 1003,
    customer: "Emma Davis",
    address: "789 Pine Rd, Chicago, IL",
    driver: "Bob Wilson",
    status: "in-transit",
    date: "2024-01-14",
  },
  {
    id: 504,
    orderId: 1002,
    customer: "James Wilson",
    address: "321 Elm St, Houston, TX",
    driver: null,
    status: "pending",
    date: "2024-01-14",
  },
  {
    id: 505,
    orderId: 1001,
    customer: "Lisa Anderson",
    address: "654 Maple Dr, Phoenix, AZ",
    driver: "Alice Brown",
    status: "delivered",
    date: "2024-01-13",
  },
]

const drivers = ["John Driver", "Jane Smith", "Bob Wilson", "Alice Brown", "Tom Davis"]

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState("")

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.id.toString().includes(searchQuery)
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = (deliveryId: number, newStatus: Delivery["status"]) => {
    setDeliveries(deliveries.map((d) => (d.id === deliveryId ? { ...d, status: newStatus } : d)))
  }

  const handleAssignDriver = () => {
    if (selectedDelivery && selectedDriver) {
      setDeliveries(
        deliveries.map((d) =>
          d.id === selectedDelivery.id ? { ...d, driver: selectedDriver, status: "assigned" } : d,
        ),
      )
      setIsAssignDriverOpen(false)
      setSelectedDriver("")
    }
  }

  const totalDeliveries = deliveries.length
  const pendingDeliveries = deliveries.filter((d) => d.status === "pending").length
  const inTransitDeliveries = deliveries.filter((d) => d.status === "in-transit").length
  const deliveredToday = deliveries.filter((d) => d.status === "delivered" && d.date === "2024-01-15").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Delivery Management</h1>
        <p className="text-muted-foreground">Track and manage deliveries</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">All deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDeliveries}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitDeliveries}</div>
            <p className="text-xs text-muted-foreground">On the way</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredToday}</div>
            <p className="text-xs text-muted-foreground">Completed deliveries</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery List</CardTitle>
          <CardDescription>View and manage all deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deliveries..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">#{delivery.id}</TableCell>
                    <TableCell>#{delivery.orderId}</TableCell>
                    <TableCell>{delivery.customer}</TableCell>
                    <TableCell>
                      {delivery.driver || <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          delivery.status === "delivered"
                            ? "default"
                            : delivery.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{delivery.date}</TableCell>
                    <TableCell className="text-right">
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
                              setSelectedDelivery(delivery)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {!delivery.driver && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDelivery(delivery)
                                setIsAssignDriverOpen(true)
                              }}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Assign Driver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(delivery.id, "in-transit")}>
                            Set as In Transit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(delivery.id, "delivered")}>
                            Set as Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(delivery.id, "failed")}
                            className="text-destructive"
                          >
                            Mark as Failed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>Delivery #{selectedDelivery?.id}</DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Customer Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span> {selectedDelivery.customer}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Address:</span> {selectedDelivery.address}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Delivery Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Delivery ID:</span> #{selectedDelivery.id}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Order ID:</span> #{selectedDelivery.orderId}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Driver:</span> {selectedDelivery.driver || "Unassigned"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Date:</span> {selectedDelivery.date}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge variant="secondary">{selectedDelivery.status}</Badge>
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDriverOpen} onOpenChange={setIsAssignDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>Assign a driver to delivery #{selectedDelivery?.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="driver">Select Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver} value={driver}>
                      {driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDriverOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignDriver}>Assign Driver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
