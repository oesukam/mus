"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { checkoutSchema, type CheckoutFormData } from "@/lib/validation"
import { useCartStore } from "@/lib/cart-store"
import { useAuthStore } from "@/lib/auth-store"
import { useCurrencyStore } from "@/lib/currency-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { getCountryCodeByCountry } from "@/lib/country-codes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, CreditCard, Smartphone, MapPin } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { useOrdersStore } from "@/lib/orders-store"
import { getCitiesForCountry, getSupportedCountries } from "@/lib/delivery-locations"
import { useShippingContext } from "@/app/checkout/page"
import { shippingAddressesApi, type ShippingAddress } from "@/lib/shipping-addresses-api"
import { mobilePaymentsApi, type MobilePayment } from "@/lib/mobile-payments-api"
import { useGuestAddressStore, type GuestShippingAddress } from "@/lib/guest-address-store"

export function CheckoutForm() {
  const router = useRouter()
  const { items, clearCart, getTotalPrice, discount } = useCartStore()
  const { token, isAuthenticated, user } = useAuthStore()
  const { currency } = useCurrencyStore()
  const addOrder = useOrdersStore((state) => state.addOrder)
  const { savedAddress: guestAddress, saveAddress: saveGuestAddress, clearAddress: clearGuestAddress } = useGuestAddressStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setShippingInfo } = useShippingContext()
  const [defaultAddress, setDefaultAddress] = useState<ShippingAddress | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([])
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [useCustomEmail, setUseCustomEmail] = useState(false)
  const [addressMode, setAddressMode] = useState<'saved' | 'new' | 'manual'>('saved')
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddressData, setNewAddressData] = useState<Partial<ShippingAddress>>({})

  // Mobile payment states
  const [savedPayments, setSavedPayments] = useState<MobilePayment[]>([])
  const [paymentMode, setPaymentMode] = useState<'saved' | 'new'>('saved')
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null)
  const [savePaymentForLater, setSavePaymentForLater] = useState(false)

  // Check if card payment is enabled
  const isCardPaymentEnabled = process.env.NEXT_PUBLIC_ENABLE_CARD_PAYMENT !== "false"

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: isCardPaymentEnabled ? "card" : "mobile_money",
      country: currency.country, // Default to selected country from currency store
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: isAuthenticated && user?.email ? user.email : "",
      recipientName: "",
      address: "",
    },
  })

  const paymentMethod = watch("paymentMethod")
  const selectedCountry = watch("country")
  const selectedCity = watch("city")
  const [availableCities, setAvailableCities] = useState<string[]>([])

  // Fetch all shipping addresses if user is logged in
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) {
        console.log("No token, skipping address fetch")
        return
      }

      console.log("Fetching shipping addresses for authenticated user...")
      setLoadingAddress(true)
      try {
        const { addresses } = await shippingAddressesApi.getAll()
        console.log(`Fetched ${addresses.length} saved addresses:`, addresses)
        setSavedAddresses(addresses)

        // Find default address
        const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0] || null
        setDefaultAddress(defaultAddr)

        // Auto-select default address if available
        if (defaultAddr) {
          console.log("Auto-selecting default address:", defaultAddr)
          setSelectedAddressId(defaultAddr.id)
          setAddressMode('saved')
          // Auto-fill the form with default address
          setValue("recipientName", defaultAddr.recipientName)
          setValue("phone", defaultAddr.recipientPhone || "")
          setValue("address", defaultAddr.address)
          setValue("country", defaultAddr.country)
          setValue("city", defaultAddr.city)
          setValue("state", defaultAddr.state || "")
          setValue("zipCode", defaultAddr.zipCode || "")
        } else {
          // No saved addresses, switch to manual mode
          console.log("No saved addresses found, switching to manual mode")
          setAddressMode('manual')
        }
      } catch (err) {
        // Silently fail - user may not have addresses yet
        console.log("Error fetching addresses:", err)
        setAddressMode('manual')
        setSavedAddresses([])
      } finally {
        setLoadingAddress(false)
      }
    }

    fetchAddresses()
  }, [token, setValue])

  // Fetch all mobile payments if user is logged in
  useEffect(() => {
    const fetchPayments = async () => {
      if (!token) {
        console.log("No token, skipping payment methods fetch")
        return
      }

      console.log("Fetching mobile payment methods for authenticated user...")
      try {
        const payments = await mobilePaymentsApi.getAll()
        console.log(`Fetched ${payments.length} saved payment methods:`, payments)
        setSavedPayments(payments)

        // Find default payment method
        const defaultPayment = payments.find(p => p.isDefault) || payments[0] || null

        // Auto-select default payment if available
        if (defaultPayment) {
          console.log("Auto-selecting default payment:", defaultPayment)
          setSelectedPaymentId(defaultPayment.id)
          setPaymentMode('saved')
          // Auto-fill the form with default payment
          setValue("mobileProvider", defaultPayment.providerName)
          setValue("mobileNumber", defaultPayment.phoneNumber)
        } else {
          // No saved payments, switch to new mode
          console.log("No saved payment methods found")
          setPaymentMode('new')
        }
      } catch (err) {
        // Silently fail - user may not have payment methods yet
        console.log("Error fetching payment methods:", err)
        setPaymentMode('new')
        setSavedPayments([])
      }
    }

    // Only fetch when payment method is mobile_money
    if (paymentMethod === "mobile_money") {
      fetchPayments()
    }
  }, [token, paymentMethod, setValue])

  // Pre-fill email for authenticated users
  useEffect(() => {
    if (isAuthenticated && user?.email && !useCustomEmail) {
      setValue("email", user.email)
    }
  }, [isAuthenticated, user?.email, useCustomEmail, setValue])

  // Function to fill form with a specific saved address
  const fillFormWithAddress = (address: ShippingAddress) => {
    setValue("recipientName", address.recipientName)
    setValue("phone", address.recipientPhone || "")
    setValue("address", address.address)
    setValue("country", address.country)
    setValue("city", address.city)
    setValue("state", address.state || "")
    setValue("zipCode", address.zipCode || "")
  }

  // Handle address selection from saved addresses
  const handleAddressSelect = (addressId: number) => {
    const address = savedAddresses.find(addr => addr.id === addressId)
    if (address) {
      setSelectedAddressId(addressId)
      fillFormWithAddress(address)
    }
  }

  // Handle switching to manual mode
  const handleManualMode = () => {
    setAddressMode('manual')
    setSelectedAddressId(null)
    // Clear the form
    setValue("recipientName", "")
    setValue("phone", "")
    setValue("address", "")
    setValue("city", "")
    setValue("state", "")
    setValue("zipCode", "")
  }

  // Handle saving a new address
  const handleSaveNewAddress = async () => {
    try {
      const { address } = await shippingAddressesApi.create({
        recipientName: newAddressData.recipientName || "",
        recipientPhone: newAddressData.recipientPhone,
        address: newAddressData.address || "",
        city: newAddressData.city || "",
        state: newAddressData.state,
        zipCode: newAddressData.zipCode,
        country: newAddressData.country || "",
        isDefault: savedAddresses.length === 0, // Make first address default
      })

      // Add to saved addresses list
      setSavedAddresses([...savedAddresses, address])

      // Select and fill the new address
      setSelectedAddressId(address.id)
      setAddressMode('saved')
      fillFormWithAddress(address)

      // Close the form
      setShowNewAddressForm(false)
      setNewAddressData({})
    } catch (err) {
      console.error("Failed to save address:", err)
      setError("Failed to save address. Please try again.")
    }
  }

  // Function to fill form with guest saved address (non-authenticated users)
  const useGuestSavedAddress = () => {
    if (!guestAddress) return

    setValue("recipientName", guestAddress.recipientName)
    setValue("email", guestAddress.email)
    setValue("phone", guestAddress.phone || "")
    setValue("address", guestAddress.address)
    setValue("country", guestAddress.country)
    setValue("city", guestAddress.city)
    setValue("state", guestAddress.state || "")
    setValue("zipCode", guestAddress.zipCode || "")
  }

  // Function to clear guest saved address
  const handleClearGuestAddress = () => {
    clearGuestAddress()
  }

  useEffect(() => {
    if (selectedCountry) {
      const cities = getCitiesForCountry(selectedCountry)
      setAvailableCities(cities)
    } else {
      setAvailableCities([])
    }
  }, [selectedCountry])

  // Update shipping context when country/city changes
  useEffect(() => {
    setShippingInfo(selectedCountry || null, selectedCity || null)
  }, [selectedCountry, selectedCity, setShippingInfo])

  // Auto-fill guest address on page load for non-authenticated users
  useEffect(() => {
    // Only auto-fill for guest users who have a saved address
    if (!isAuthenticated && guestAddress) {
      setValue("recipientName", guestAddress.recipientName)
      setValue("email", guestAddress.email)
      setValue("phone", guestAddress.phone || "")
      setValue("address", guestAddress.address)
      setValue("country", guestAddress.country)
      setValue("city", guestAddress.city)
      setValue("state", guestAddress.state || "")
      setValue("zipCode", guestAddress.zipCode || "")
    }
  }, [isAuthenticated, guestAddress, setValue])

  const onSubmit = async (data: CheckoutFormData) => {
    console.log("Form submitted with data:", data)
    setIsSubmitting(true)
    setError(null)

    try {
      // Build headers - include auth token if available (for authenticated users)
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          formData: data,
          cartItems: items,
          discount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle stock/availability errors with specific product names
        if (result.unavailableItems && Array.isArray(result.unavailableItems)) {
          const unavailableDetails = result.unavailableItems.map((item: any) => {
            const cartItem = items.find((i) => i.id === item.productId)
            const productName = cartItem?.name || `Product #${item.productId}`
            return `${productName} (${item.reason})`
          }).join(", ")

          throw new Error(`${result.error}: ${unavailableDetails}`)
        }

        throw new Error(result.error || "Failed to process order")
      }

      console.log("Order created:", result.orderNumber)
      if (result.order) {
        addOrder(result.order)
      }

      // Save mobile payment for authenticated users if checkbox is checked
      if (isAuthenticated && savePaymentForLater && data.paymentMethod === "mobile_money" && data.mobileProvider && data.mobileNumber) {
        try {
          console.log("Saving mobile payment method...")
          const mobilePayment = await mobilePaymentsApi.create({
            providerName: data.mobileProvider,
            phoneNumber: data.mobileNumber,
            label: `${data.mobileProvider} - ${data.mobileNumber.slice(-4)}`, // Auto-generate label
            isDefault: savedPayments.length === 0, // Make first payment default
          })
          console.log("Mobile payment saved successfully:", mobilePayment)

          // Update the saved payments list
          setSavedPayments([...savedPayments, mobilePayment])
        } catch (paymentSaveError) {
          // Don't fail the checkout if saving payment fails, just log it
          console.error("Failed to save payment method:", paymentSaveError)
        }
      }

      // Save guest address for non-authenticated users
      if (!isAuthenticated) {
        const guestAddressData: GuestShippingAddress = {
          recipientName: data.recipientName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        }
        saveGuestAddress(guestAddressData)
      }

      clearCart()
      router.push(`/checkout/success?orderNumber=${result.orderNumber}&email=${encodeURIComponent(data.email)}`)
    } catch (err) {
      console.error("Checkout error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const onError = (errors: any) => {
    console.log("Form validation errors:", errors)
    // Scroll to top to show errors
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Create specific error message listing all fields with errors
    const errorFields = Object.keys(errors)
    const fieldNames: Record<string, string> = {
      email: "Email",
      recipientName: "Recipient Name",
      phone: "Phone",
      address: "Address",
      country: "Country",
      city: "City",
      state: "State/Province",
      zipCode: "ZIP/Postal Code",
      paymentMethod: "Payment Method",
      cardNumber: "Card Number",
      expiryDate: "Expiry Date",
      cvv: "CVV",
      mobileProvider: "Mobile Money Provider",
      mobileNumber: "Mobile Number",
    }

    if (errorFields.length === 1) {
      const field = fieldNames[errorFields[0]] || errorFields[0]
      setError(`Please check ${field}: ${errors[errorFields[0]].message}`)
    } else if (errorFields.length > 1) {
      const fields = errorFields.map((key) => fieldNames[key] || key).join(", ")
      setError(`Please fix the following fields: ${fields}`)
    } else {
      setError("Please fix the errors in the form before submitting")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info alert for guest users with saved address */}
      {!isAuthenticated && guestAddress && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Your shipping information has been loaded from your previous order.{" "}
            <button
              type="button"
              onClick={handleClearGuestAddress}
              className="underline hover:no-underline font-medium"
            >
              Clear saved address
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="email">Email</Label>
              {isAuthenticated && user?.email && !useCustomEmail && (
                <button
                  type="button"
                  onClick={() => setUseCustomEmail(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Use different email
                </button>
              )}
              {isAuthenticated && user?.email && useCustomEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomEmail(false)
                    setValue("email", user.email)
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Use account email
                </button>
              )}
            </div>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              disabled={isAuthenticated && user?.email && !useCustomEmail}
              className={errors.email ? "border-destructive" : ""}
            />
            {isAuthenticated && user?.email && !useCustomEmail && (
              <p className="text-xs text-muted-foreground mt-1">
                Using your account email. Order confirmation will be sent here.
              </p>
            )}
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authenticated user - show address selector */}
          {isAuthenticated && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              {/* Loading state */}
              {loadingAddress && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading addresses...</span>
                </div>
              )}

              {/* Loaded state */}
              {!loadingAddress && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      {savedAddresses.length > 0 ? 'Select Shipping Address' : 'Shipping Address'}
                    </h3>
                    {savedAddresses.length > 0 && addressMode === 'saved' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleManualMode}
                        className="text-xs"
                      >
                        Enter Manually
                      </Button>
                    )}
                  </div>

                  {/* Show saved addresses */}
                  {savedAddresses.length > 0 && addressMode === 'saved' && (
                    <>
                      <RadioGroup
                        value={selectedAddressId?.toString()}
                        onValueChange={(value) => handleAddressSelect(Number(value))}
                        className="space-y-2"
                      >
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            className="flex items-start space-x-3 p-3 rounded-md border bg-background hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleAddressSelect(addr.id)}
                          >
                            <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} />
                            <Label
                              htmlFor={`addr-${addr.id}`}
                              className="flex-1 cursor-pointer space-y-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{addr.recipientName}</span>
                                {addr.isDefault && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {addr.address}, {addr.city}, {addr.country}
                                {addr.recipientPhone && ` • ${addr.recipientPhone}`}
                              </p>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {/* Add New Address button - shown with saved addresses */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewAddressForm(true)}
                        className="w-full"
                      >
                        + Add New Address
                      </Button>
                    </>
                  )}

                  {/* No saved addresses - show add new button */}
                  {savedAddresses.length === 0 && addressMode === 'manual' && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        You don't have any saved addresses yet. Enter your shipping address below.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewAddressForm(true)}
                        className="w-full"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Save Address for Future Orders
                      </Button>
                    </div>
                  )}

                  {/* Manual mode message - when user has saved addresses but chose manual */}
                  {savedAddresses.length > 0 && addressMode === 'manual' && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Enter your shipping address below. This address will not be saved.
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setAddressMode('saved')}
                        className="px-0 h-auto text-xs"
                      >
                        Use a saved address instead
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Guest user - simple saved address button */}
          {!isAuthenticated && guestAddress && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useGuestSavedAddress}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Use saved address
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearGuestAddress}
                className="text-destructive hover:text-destructive"
              >
                Clear
              </Button>
            </div>
          )}
          <div>
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input
              id="recipientName"
              placeholder="John Doe"
              {...register("recipientName")}
              className={errors.recipientName ? "border-destructive" : ""}
            />
            {errors.recipientName && (
              <p className="text-sm text-destructive mt-1">{errors.recipientName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  value={field.value || ""}
                  onChange={field.onChange}
                  defaultCountryCode={getCountryCodeByCountry(selectedCountry)?.dialCode}
                />
              )}
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main St"
              {...register("address")}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && (
              <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger id="country" className={errors.country ? "border-destructive" : ""}>
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
              )}
            />
            {errors.country && (
              <p className="text-sm text-destructive mt-1">{errors.country.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              <a
                href="/delivery-coverage"
                target="_blank"
                className="underline hover:text-foreground"
                rel="noreferrer"
              >
                View delivery coverage
              </a>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!selectedCountry || availableCities.length === 0}
                  >
                    <SelectTrigger
                      id="city"
                      className={errors.city ? "border-destructive" : ""}
                    >
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
                )}
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="state">State/Province (optional)</Label>
              <Input
                id="state"
                placeholder="NY"
                {...register("state")}
                className={errors.state ? "border-destructive" : ""}
              />
              {errors.state && (
                <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="zipCode">Postal Code (optional)</Label>
              <Input
                id="zipCode"
                placeholder="10001"
                {...register("zipCode")}
                className={errors.zipCode ? "border-destructive" : ""}
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setValue("paymentMethod", value as "card" | "mobile_money")}
              className={isCardPaymentEnabled ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}
            >
              {isCardPaymentEnabled && (
                <div>
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-foreground [&:has([data-state=checked])]:border-foreground cursor-pointer"
                  >
                    <CreditCard className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Credit Card</span>
                  </Label>
                </div>
              )}
              <div>
                <RadioGroupItem value="mobile_money" id="mobile_money" className="peer sr-only" />
                <Label
                  htmlFor="mobile_money"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-foreground [&:has([data-state=checked])]:border-foreground cursor-pointer"
                >
                  <Smartphone className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Mobile Money</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === "card" && (
            <>
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234567812345678"
                  maxLength={16}
                  {...register("cardNumber")}
                  className={errors.cardNumber ? "border-destructive" : ""}
                />
                {errors.cardNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.cardNumber.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    maxLength={5}
                    {...register("expiryDate")}
                    className={errors.expiryDate ? "border-destructive" : ""}
                  />
                  {errors.expiryDate && (
                    <p className="text-sm text-destructive mt-1">{errors.expiryDate.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    {...register("cvv")}
                    className={errors.cvv ? "border-destructive" : ""}
                  />
                  {errors.cvv && (
                    <p className="text-sm text-destructive mt-1">{errors.cvv.message}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {paymentMethod === "mobile_money" && (
            <>
              {/* Saved payment methods selection for authenticated users */}
              {isAuthenticated && savedPayments.length > 0 && (
                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <RadioGroup value={paymentMode} onValueChange={(value: 'saved' | 'new') => setPaymentMode(value)}>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="saved" id="saved-payment" />
                        <Label htmlFor="saved-payment" className="cursor-pointer">Use saved payment method</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new-payment" />
                        <Label htmlFor="new-payment" className="cursor-pointer">Enter new payment details</Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Show saved payment methods when in saved mode */}
                  {paymentMode === 'saved' && (
                    <div className="space-y-2">
                      <Label>Select Payment Method</Label>
                      <RadioGroup
                        value={selectedPaymentId?.toString() || ""}
                        onValueChange={(value) => {
                          const paymentId = parseInt(value)
                          const payment = savedPayments.find(p => p.id === paymentId)
                          if (payment) {
                            setSelectedPaymentId(paymentId)
                            setValue("mobileProvider", payment.providerName)
                            setValue("mobileNumber", payment.phoneNumber)
                          }
                        }}
                      >
                        {savedPayments.map((payment) => (
                          <div key={payment.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                            <RadioGroupItem value={payment.id.toString()} id={`payment-${payment.id}`} />
                            <Label htmlFor={`payment-${payment.id}`} className="cursor-pointer flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{payment.providerName}</p>
                                  <p className="text-sm text-muted-foreground">{payment.phoneNumber}</p>
                                  {payment.label && <p className="text-xs text-muted-foreground">{payment.label}</p>}
                                </div>
                                {payment.isDefault && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                                )}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}
                </div>
              )}

              {/* Show payment form fields when in new mode or no saved payments */}
              {(!isAuthenticated || savedPayments.length === 0 || paymentMode === 'new') && (
                <>
                  <div>
                    <Label htmlFor="mobileProvider">Mobile Money Provider *</Label>
                    <Controller
                      name="mobileProvider"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id="mobileProvider"
                            className={errors.mobileProvider ? "border-destructive" : ""}
                          >
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                            <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                            <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                            <SelectItem value="Orange Money">Orange Money</SelectItem>
                            <SelectItem value="Tigo Pesa">Tigo Pesa</SelectItem>
                            <SelectItem value="Vodacom M-Pesa">Vodacom M-Pesa</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.mobileProvider && (
                      <p className="text-sm text-destructive mt-1">{errors.mobileProvider.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Controller
                      name="mobileNumber"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          id="mobileNumber"
                          value={field.value || ""}
                          onChange={field.onChange}
                          defaultCountryCode={getCountryCodeByCountry(selectedCountry)?.dialCode}
                          className={errors.mobileNumber ? "border-destructive" : ""}
                        />
                      )}
                    />
                    {errors.mobileNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.mobileNumber.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the mobile money number that will be charged
                    </p>
                  </div>

                  {/* Save payment for later checkbox (only for authenticated users entering new payment) */}
                  {isAuthenticated && (
                    <div className="flex items-start space-x-2 bg-muted/50 p-3 rounded-md">
                      <input
                        type="checkbox"
                        id="savePayment"
                        checked={savePaymentForLater}
                        onChange={(e) => setSavePaymentForLater(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="savePayment"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Save this mobile payment method for future orders
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          We'll securely save this payment method to your account. You can set it as default later.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          "Complete Order"
        )}
      </Button>

      {/* Add New Address Dialog */}
      <Dialog open={showNewAddressForm} onOpenChange={setShowNewAddressForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Shipping Address</DialogTitle>
            <DialogDescription>
              This address will be saved to your account for future orders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-recipientName">Recipient Name *</Label>
              <Input
                id="new-recipientName"
                placeholder="John Doe"
                value={newAddressData.recipientName || ""}
                onChange={(e) => setNewAddressData({ ...newAddressData, recipientName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="new-phone">Phone Number</Label>
              <PhoneInput
                key={newAddressData.country} // Force re-render when country changes
                id="new-phone"
                value={newAddressData.recipientPhone || ""}
                onChange={(value) => setNewAddressData({ ...newAddressData, recipientPhone: value })}
                defaultCountryCode={getCountryCodeByCountry(newAddressData.country || currency.country)?.dialCode}
              />
            </div>

            <div>
              <Label htmlFor="new-address">Address *</Label>
              <Input
                id="new-address"
                placeholder="123 Main Street"
                value={newAddressData.address || ""}
                onChange={(e) => setNewAddressData({ ...newAddressData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-country">Country *</Label>
                <Select
                  value={newAddressData.country || ""}
                  onValueChange={(value) => setNewAddressData({ ...newAddressData, country: value, city: "" })}
                >
                  <SelectTrigger id="new-country">
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

              <div>
                <Label htmlFor="new-city">City *</Label>
                <Select
                  value={newAddressData.city || ""}
                  onValueChange={(value) => setNewAddressData({ ...newAddressData, city: value })}
                  disabled={!newAddressData.country}
                >
                  <SelectTrigger id="new-city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {newAddressData.country && getCitiesForCountry(newAddressData.country).map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-state">State/Province</Label>
                <Input
                  id="new-state"
                  placeholder="Optional"
                  value={newAddressData.state || ""}
                  onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="new-zipCode">ZIP/Postal Code</Label>
                <Input
                  id="new-zipCode"
                  placeholder="Optional"
                  value={newAddressData.zipCode || ""}
                  onChange={(e) => setNewAddressData({ ...newAddressData, zipCode: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewAddressForm(false)
                setNewAddressData({})
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNewAddress}
              disabled={
                !newAddressData.recipientName ||
                !newAddressData.address ||
                !newAddressData.country ||
                !newAddressData.city
              }
            >
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
