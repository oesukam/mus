import { deliveryLocations } from "@/lib/delivery-locations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, MapPin, Globe } from "lucide-react"

export default function DeliveryCoveragePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Delivery Coverage</h1>
          <p className="text-lg text-muted-foreground">
            We deliver to {deliveryLocations.length} countries worldwide. Check if we deliver to your location below.
          </p>
        </div>

        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{deliveryLocations.length}</p>
                  <p className="text-sm text-muted-foreground">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {deliveryLocations.reduce((acc, loc) => acc + loc.cities.length, 0)}+
                  </p>
                  <p className="text-sm text-muted-foreground">Cities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">3-7 Days</p>
                  <p className="text-sm text-muted-foreground">Avg. Delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deliveryLocations.map((location) => (
            <Card key={location.code}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">
                    {location.code === "US"
                      ? "🇺🇸"
                      : location.code === "GB"
                        ? "🇬🇧"
                        : location.code === "CA"
                          ? "🇨🇦"
                          : location.code === "AU"
                            ? "🇦🇺"
                            : location.code === "DE"
                              ? "🇩🇪"
                              : location.code === "FR"
                                ? "🇫🇷"
                                : location.code === "GH"
                                  ? "🇬🇭"
                                  : location.code === "NG"
                                    ? "🇳🇬"
                                    : location.code === "ZA"
                                      ? "🇿🇦"
                                      : location.code === "KE"
                                        ? "🇰🇪"
                                        : "🌍"}
                  </span>
                  {location.country}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{location.cities.length} cities available</p>
                <div className="flex flex-wrap gap-2">
                  {location.cities.slice(0, 8).map((city) => (
                    <span
                      key={city}
                      className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                    >
                      {city}
                    </span>
                  ))}
                  {location.cities.length > 8 && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      +{location.cities.length - 8} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-2">Don't see your location?</h3>
          <p className="text-muted-foreground mb-4">
            We're constantly expanding our delivery network. Contact us to request delivery to your area.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Request New Location
          </a>
        </div>
      </div>
    </div>
  )
}
