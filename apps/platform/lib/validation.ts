import { z } from "zod"
import { isDeliverySupported, getSupportedCountries } from "./delivery-locations"

export const checkoutSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    recipientName: z.string().min(3, "Recipient name must be at least 3 characters"),
    phone: z.string().optional(),
    address: z.string().min(5, "Please enter a valid address"),
    country: z
      .string()
      .min(1, "Please select a country")
      .refine((country) => getSupportedCountries().includes(country), {
        message: "We don't currently deliver to this country",
      }),
    city: z.string().min(2, "Please enter a valid city"),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    paymentMethod: z.enum(["card", "mobile_money"], {
      required_error: "Please select a payment method",
    }),
    // Card payment fields (optional, validated conditionally)
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(),
    // Mobile Money fields (optional, validated conditionally)
    mobileProvider: z.string().optional(),
    mobileNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      return isDeliverySupported(data.country, data.city)
    },
    {
      message: "We don't currently deliver to this city. Please check our delivery coverage page.",
      path: ["city"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod === "card") {
        return (
          data.cardNumber &&
          /^\d{16}$/.test(data.cardNumber) &&
          data.expiryDate &&
          /^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate) &&
          data.cvv &&
          /^\d{3,4}$/.test(data.cvv)
        )
      }
      return true
    },
    {
      message: "Please fill in all card details",
      path: ["cardNumber"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod === "mobile_money") {
        return !!data.mobileProvider
      }
      return true
    },
    {
      message: "Please select a mobile money provider",
      path: ["mobileProvider"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod === "mobile_money") {
        if (!data.mobileNumber) {
          return false
        }
        // Remove spaces, dashes, and parentheses for validation
        const cleanNumber = data.mobileNumber.replace(/[\s\-\(\)]/g, '')
        // Must start with + or digit, and have 7-15 total digits
        return /^\+?[1-9]\d{6,14}$/.test(cleanNumber)
      }
      return true
    },
    {
      message: "Please enter a valid mobile number",
      path: ["mobileNumber"],
    },
  )

export type CheckoutFormData = z.infer<typeof checkoutSchema>
