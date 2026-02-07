"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettingsStore } from "@/lib/settings-store"
import { useAuthStore } from "@/lib/auth-store"
import { ProtectedRoute } from "@/components/protected-route"
import { ArrowLeft, Loader2, MapPin, ChevronRight, CreditCard } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const settings = useSettingsStore()
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  // Fetch settings when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      settings.fetchSettings()
    }
  }, [isAuthenticated])

  const handleSave = async () => {
    try {
      // Settings are auto-saved on change, so just show success message
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (settings.isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your settings...</p>
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

          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">Manage your account preferences and settings</p>

          <div className="space-y-6">
            {/* Quick Access Links */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/shipping-addresses">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Shipping Addresses</p>
                        <p className="text-sm text-muted-foreground">Manage your delivery addresses</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/mobile-payments">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Mobile Payments</p>
                        <p className="text-sm text-muted-foreground">Manage your mobile money accounts</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="order-updates">Order Updates</Label>
                  <p className="text-sm text-muted-foreground">Get notified about your order status</p>
                </div>
                <Switch
                  id="order-updates"
                  checked={settings.notifications.orderUpdates}
                  onCheckedChange={(checked) => settings.updateNotificationSettings({ orderUpdates: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="promotions">Promotions & Deals</Label>
                  <p className="text-sm text-muted-foreground">Receive special offers and discounts</p>
                </div>
                <Switch
                  id="promotions"
                  checked={settings.notifications.promotions}
                  onCheckedChange={(checked) => settings.updateNotificationSettings({ promotions: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="wishlist-alerts">Wishlist Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about price drops and stock updates</p>
                </div>
                <Switch
                  id="wishlist-alerts"
                  checked={settings.notifications.wishlistAlerts}
                  onCheckedChange={(checked) => settings.updateNotificationSettings({ wishlistAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newsletter">Newsletter</Label>
                  <p className="text-sm text-muted-foreground">Receive our weekly newsletter</p>
                </div>
                <Switch
                  id="newsletter"
                  checked={settings.notifications.newsletter}
                  onCheckedChange={(checked) => settings.updateNotificationSettings({ newsletter: checked })}
                />
              </div>
            </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Control your privacy and data sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-profile">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                </div>
                <Switch
                  id="show-profile"
                  checked={settings.privacy.showProfile}
                  onCheckedChange={(checked) => settings.updatePrivacySettings({ showProfile: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-data">Share Analytics Data</Label>
                  <p className="text-sm text-muted-foreground">Help us improve by sharing usage data</p>
                </div>
                <Switch
                  id="share-data"
                  checked={settings.privacy.shareData}
                  onCheckedChange={(checked) => settings.updatePrivacySettings({ shareData: checked })}
                />
              </div>
            </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your shopping experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={settings.preferences.currency}
                  onValueChange={(value) => settings.updatePreferences({ currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.preferences.language}
                  onValueChange={(value) => settings.updatePreferences({ language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
              <Button variant="outline" onClick={settings.resetToDefaults}>
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
