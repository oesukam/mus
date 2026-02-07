"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { authApi } from "@/lib/auth-api"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authApi.forgotPassword({ email })
      setIsSuccess(true)
      toast({
        title: "Email sent",
        description: "Check your inbox for the password reset link.",
      })
    } catch (err) {
      toast({
        title: "Failed to send reset link",
        description: "Please check your email address and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
            <span className="text-2xl font-bold">M</span>
          </div>
          <h1 className="text-3xl font-bold text-balance">Reset Password</h1>
          <p className="text-muted-foreground mt-2">{isSuccess ? "Check your email" : "We'll send you a reset link"}</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          {!isSuccess ? (
            <>
              <CardHeader>
                <CardTitle>Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@mus.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send reset link"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <CardTitle className="text-center">Check your email</CardTitle>
                <CardDescription className="text-center">We've sent a password reset link to</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-accent/5 border-accent/20">
                  <Mail className="h-4 w-4 text-accent" />
                  <AlertDescription className="font-medium text-accent-foreground">{email}</AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button onClick={() => setIsSuccess(false)} className="text-primary hover:underline font-medium">
                    try again
                  </button>
                </p>
              </CardContent>
            </>
          )}
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline font-medium">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
