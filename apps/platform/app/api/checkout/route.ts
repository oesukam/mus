import { type NextRequest, NextResponse } from "next/server"
import { checkoutSchema } from "@/lib/validation"
import { ordersApi, type CreateOrderDto, type OrderItem } from "@/lib/orders-api"
import { getCountryCode } from "@/lib/delivery-locations"
import { ApiError } from "@/lib/api-client"

const VAT_PERCENTAGE = 18 // 18% VAT

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate form data
    const validationResult = checkoutSchema.safeParse(body.formData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: validationResult.error.errors },
        { status: 400 },
      )
    }

    const { formData, cartItems, discount } = body

    // Stock validation is now handled by the backend order API
    // No need to validate here - backend will return proper error if stock is insufficient

    // Get auth token from request (optional for guest checkout)
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    console.log("Processing checkout:", {
      hasAuth: !!token,
      userType: token ? "authenticated" : "guest",
    })

    // Map country name to country code
    const countryCode = getCountryCode(formData.country)
    if (!countryCode) {
      return NextResponse.json(
        { error: "Invalid country selected" },
        { status: 400 },
      )
    }

    // Calculate totals
    const subtotal = cartItems.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    )

    // Apply discount if present
    let discountAmount = 0
    if (discount) {
      if (discount.type === "percentage") {
        discountAmount = (subtotal * discount.value) / 100
      } else if (discount.type === "fixed") {
        discountAmount = discount.value
      }
    }

    const subtotalAfterDiscount = subtotal - discountAmount

    // Calculate VAT
    const vatAmount = subtotalAfterDiscount * (VAT_PERCENTAGE / 100)
    const totalAmount = subtotalAfterDiscount + vatAmount

    // Transform cart items to order items with VAT details
    const orderItems: OrderItem[] = cartItems.map((item: any) => {
      const itemSubtotal = item.price * item.quantity
      const itemVatAmount = itemSubtotal * (VAT_PERCENTAGE / 100)

      return {
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        vatPercentage: VAT_PERCENTAGE,
        vatAmount: itemVatAmount,
      }
    })

    // Create order data with recipient and shipping information
    const orderData: CreateOrderDto = {
      country: countryCode,
      items: orderItems,
      subtotal: subtotalAfterDiscount,
      vatAmount,
      totalAmount,
      recipientName: formData.recipientName,
      recipientEmail: formData.email,
      recipientPhone: formData.phone,
      shippingAddress: formData.address,
      shippingCity: formData.city,
      shippingState: formData.state,
      shippingZipCode: formData.zipCode,
      shippingCountry: formData.country,
    }

    // Create order via backend API (pass token if available for authenticated users)
    const { order } = await ordersApi.createOrder(orderData, token)

    console.log("Order created successfully:", {
      orderNumber: order.orderNumber,
      orderId: order.id,
      total: order.totalAmount,
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber || null,
      message: "Order created successfully",
      order: {
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        items: cartItems.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        total: order.totalAmount,
        status: order.deliveryStatus.toLowerCase(),
        paymentStatus: order.paymentStatus.toLowerCase(),
        createdAt: order.createdAt,
        shippingAddress: {
          recipientName: formData.recipientName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        email: formData.email,
        trackingNumber: order.trackingNumber,
      },
    })
  } catch (error) {
    console.error("Checkout error:", error)

    // Handle API errors
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: error.message || "Failed to process order",
          details: error.data,
        },
        { status: error.status || 500 },
      )
    }

    // Handle other errors
    return NextResponse.json(
      { error: "Failed to process order. Please try again." },
      { status: 500 },
    )
  }
}
