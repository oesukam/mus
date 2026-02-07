import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const notificationRequestSchema = z.object({
  email: z.string().email(),
  productId: z.string(),
  productName: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request data
    const validationResult = notificationRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 },
      )
    }

    const { email, productId, productName } = validationResult.data

    // In a real app, you would:
    // 1. Save the notification request to a database
    // 2. Set up a system to check stock levels
    // 3. Send emails when products are back in stock
    // 4. Prevent duplicate notifications for the same email/product

    console.log("Stock notification registered:", {
      email,
      productId,
      productName,
      timestamp: new Date().toISOString(),
    })

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      message: "Notification registered successfully",
    })
  } catch (error) {
    console.error("Stock notification error:", error)
    return NextResponse.json(
      { error: "Failed to register notification. Please try again." },
      { status: 500 },
    )
  }
}
