"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/auth-store"
import { ProtectedRoute } from "@/components/protected-route"
import { ArrowLeft, Loader2, Plus, CreditCard, Trash2, Edit, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  mobilePaymentsApi,
  type MobilePayment,
  type CreateMobilePaymentDto,
  type UpdateMobilePaymentDto,
} from "@/lib/mobile-payments-api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const MOBILE_PAYMENT_PROVIDERS = [
  "MTN Mobile Money",
  "Airtel Money",
  "M-Pesa",
  "Orange Money",
  "Tigo Pesa",
  "Vodacom M-Pesa",
]

export default function MobilePaymentsPage() {
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [payments, setPayments] = useState<MobilePayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<MobilePayment | null>(null)
  const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateMobilePaymentDto>({
    providerName: "",
    phoneNumber: "",
    label: "",
    isDefault: false,
  })

  // Fetch payments on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPayments()
    }
  }, [isAuthenticated])

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      const fetchedPayments = await mobilePaymentsApi.getAll()
      setPayments(fetchedPayments)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load payment methods",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      providerName: "",
      phoneNumber: "",
      label: "",
      isDefault: false,
    })
    setEditingPayment(null)
  }

  const handleOpenDialog = (payment?: MobilePayment) => {
    if (payment) {
      // Editing existing payment
      setEditingPayment(payment)
      setFormData({
        providerName: payment.providerName,
        phoneNumber: payment.phoneNumber,
        label: payment.label || "",
        isDefault: payment.isDefault,
      })
    } else {
      // Creating new payment
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      if (editingPayment) {
        // Update existing payment
        const updatedPayment = await mobilePaymentsApi.update(editingPayment.id, formData)

        // Update payment in local state immediately
        setPayments(prevPayments =>
          prevPayments.map(payment =>
            payment.id === editingPayment.id ? updatedPayment : payment
          )
        )

        toast({
          title: "Success",
          description: "Payment method updated successfully",
        })
      } else {
        // Create new payment
        const newPayment = await mobilePaymentsApi.create(formData)

        // Add new payment to local state immediately
        setPayments(prevPayments => {
          // If this is set as default, unset others
          if (newPayment.isDefault) {
            return [
              newPayment,
              ...prevPayments.map(payment => ({ ...payment, isDefault: false }))
            ]
          }
          return [newPayment, ...prevPayments]
        })

        toast({
          title: "Success",
          description: "Payment method added successfully",
        })
      }

      handleCloseDialog()

      // Fetch in background to ensure consistency
      fetchPayments()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save payment method",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await mobilePaymentsApi.setAsDefault(id)

      // Update local state immediately
      setPayments(prevPayments =>
        prevPayments.map(payment => ({
          ...payment,
          isDefault: payment.id === id
        }))
      )

      toast({
        title: "Success",
        description: "Default payment method updated successfully",
      })

      // Fetch in background to ensure consistency
      fetchPayments()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to set default payment method",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deletePaymentId) return

    try {
      await mobilePaymentsApi.delete(deletePaymentId)

      // Remove payment from local state immediately
      setPayments(prevPayments =>
        prevPayments.filter(payment => payment.id !== deletePaymentId)
      )

      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      })

      // Fetch in background to ensure consistency
      fetchPayments()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete payment method",
        variant: "destructive",
      })
    } finally {
      setDeletePaymentId(null)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your payment methods...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mobile Payment Methods</h1>
              <p className="text-muted-foreground">Manage your mobile money accounts for quick checkout</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPayment ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
                  <DialogDescription>
                    {editingPayment
                      ? "Update your mobile payment details"
                      : "Add a new mobile payment method to your account"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="providerName">Provider</Label>
                    <Select
                      value={formData.providerName}
                      onValueChange={(value) => setFormData({ ...formData, providerName: value })}
                    >
                      <SelectTrigger id="providerName">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOBILE_PAYMENT_PROVIDERS.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <PhoneInput
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
                      placeholder="+250 788 123 456"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="label">Label (optional)</Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="My Primary Account"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isDefault" className="cursor-pointer">
                      Set as default payment method
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingPayment ? (
                      "Update"
                    ) : (
                      "Add"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {payments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payment methods yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your mobile money account to make checkout faster and easier
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {payments.map((payment) => (
                <Card key={payment.id} className={payment.isDefault ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{payment.providerName}</CardTitle>
                          {payment.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              <Check className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <CardDescription>{payment.phoneNumber}</CardDescription>
                        {payment.label && (
                          <p className="text-sm text-muted-foreground mt-1">{payment.label}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletePaymentId(payment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {!payment.isDefault && (
                    <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(payment.id)}
                      >
                        Set as default
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deletePaymentId !== null} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment method. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
