"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const notificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type NotificationFormData = z.infer<typeof notificationSchema>

interface StockNotificationFormProps {
  productId: string | number
  productName: string
}

export function StockNotificationForm({ productId, productName }: StockNotificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
  })

  const onSubmit = async (data: NotificationFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/stock-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          productId,
          productName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to register notification")
      }

      setIsSuccess(true)
      reset()
      toast({
        title: "Notification registered",
        description: "We'll email you when this product is back in stock.",
      })
    } catch (error) {
      console.error("Stock notification error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register notification",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-accent">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">
              You'll be notified when this item is back in stock
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Notify Me When Available
        </CardTitle>
        <CardDescription>
          Enter your email to get notified when this product is back in stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Notify Me
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
