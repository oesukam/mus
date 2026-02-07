"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/auth-store"
import { useCurrencyStore } from "@/lib/currency-store"
import { getCountryCodeByCountry } from "@/lib/country-codes"
import { ProtectedRoute } from "@/components/protected-route"
import { ArrowLeft, Loader2, Plus, MapPin, Trash2, Edit, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  shippingAddressesApi,
  type ShippingAddress,
  type CreateShippingAddressDto,
  type UpdateShippingAddressDto,
} from "@/lib/shipping-addresses-api"
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
import { getSupportedCountries, getCitiesForCountry } from "@/lib/delivery-locations"
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

export default function ShippingAddressesPage() {
  const { isAuthenticated } = useAuthStore()
  const { currency } = useCurrencyStore()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null)
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateShippingAddressDto>({
    recipientName: "",
    recipientPhone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    isDefault: false,
  })
  const [selectedCountry, setSelectedCountry] = useState("")
  const [availableCities, setAvailableCities] = useState<string[]>([])

  // Fetch addresses on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses()
    }
  }, [isAuthenticated])

  // Update available cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      const cities = getCitiesForCountry(selectedCountry)
      setAvailableCities(cities)
    } else {
      setAvailableCities([])
    }
  }, [selectedCountry])

  const fetchAddresses = async () => {
    try {
      setIsLoading(true)
      const { addresses: fetchedAddresses } = await shippingAddressesApi.getAll()
      setAddresses(fetchedAddresses)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load addresses",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    // Default to the selected country from currency store
    const defaultCountry = currency.country

    setFormData({
      recipientName: "",
      recipientPhone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: defaultCountry,
      isDefault: false,
    })
    setSelectedCountry(defaultCountry)
    setEditingAddress(null)
  }

  const handleOpenDialog = (address?: ShippingAddress) => {
    if (address) {
      // Editing existing address - use address data
      setEditingAddress(address)
      setFormData({
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone || "",
        address: address.address,
        city: address.city,
        state: address.state || "",
        zipCode: address.zipCode || "",
        country: address.country,
        isDefault: address.isDefault,
      })
      setSelectedCountry(address.country)
    } else {
      // Creating new address - default to selected country from currency store
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

      if (editingAddress) {
        // Update existing address
        const { address: updatedAddress } = await shippingAddressesApi.update(editingAddress.id, formData)

        // Update address in local state immediately
        setAddresses(prevAddresses =>
          prevAddresses.map(addr =>
            addr.id === editingAddress.id ? updatedAddress : addr
          )
        )

        toast({
          title: "Success",
          description: "Shipping address updated successfully",
        })
      } else {
        // Create new address
        const { address: newAddress } = await shippingAddressesApi.create(formData)

        // Add new address to local state immediately
        setAddresses(prevAddresses => {
          // If this is set as default, unset others
          if (newAddress.isDefault) {
            return [
              newAddress,
              ...prevAddresses.map(addr => ({ ...addr, isDefault: false }))
            ]
          }
          return [newAddress, ...prevAddresses]
        })

        toast({
          title: "Success",
          description: "Shipping address added successfully",
        })
      }

      handleCloseDialog()

      // Fetch in background to ensure consistency
      fetchAddresses()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save address",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await shippingAddressesApi.setAsDefault(id)

      // Update local state immediately
      setAddresses(prevAddresses =>
        prevAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === id
        }))
      )

      toast({
        title: "Success",
        description: "Default address updated successfully",
      })

      // Fetch in background to ensure consistency
      fetchAddresses()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to set default address",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteAddressId) return

    try {
      await shippingAddressesApi.delete(deleteAddressId)

      // Remove address from local state immediately
      setAddresses(prevAddresses =>
        prevAddresses.filter(addr => addr.id !== deleteAddressId)
      )

      toast({
        title: "Success",
        description: "Shipping address deleted successfully",
      })

      // Fetch in background to ensure consistency
      fetchAddresses()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete address",
        variant: "destructive",
      })
    } finally {
      setDeleteAddressId(null)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your addresses...</p>
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
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Shipping Addresses</h1>
              <p className="text-muted-foreground">Manage your delivery addresses</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                  <DialogDescription>
                    {editingAddress
                      ? "Update your shipping address details"
                      : "Add a new shipping address to your account"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recipientPhone">Phone Number (optional)</Label>
                    <PhoneInput
                      key={formData.country} // Force re-render when country changes
                      id="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={(value) => setFormData({ ...formData, recipientPhone: value })}
                      defaultCountryCode={getCountryCodeByCountry(formData.country)?.dialCode}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => {
                        setFormData({ ...formData, country: value, city: "" })
                        setSelectedCountry(value)
                      }}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSupportedCountries().map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) => setFormData({ ...formData, city: value })}
                        disabled={!selectedCountry || availableCities.length === 0}
                      >
                        <SelectTrigger id="city">
                          <SelectValue placeholder={selectedCountry ? "Select city" : "Select country first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">State/Province (optional)</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="NY"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">Postal Code (optional)</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="10001"
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
                      Set as default shipping address
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
                    ) : editingAddress ? (
                      "Update Address"
                    ) : (
                      "Add Address"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {addresses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first shipping address to make checkout easier
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {addresses.map((address) => (
                <Card key={address.id} className={address.isDefault ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{address.recipientName}</CardTitle>
                          {address.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              <Check className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        {address.recipientPhone && (
                          <CardDescription>{address.recipientPhone}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(address)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteAddressId(address.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">{address.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}
                        {address.state && `, ${address.state}`}
                        {address.zipCode && ` ${address.zipCode}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{address.country}</p>
                    </div>
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Set as default
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteAddressId !== null} onOpenChange={() => setDeleteAddressId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this shipping address. This action cannot be undone.
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
