"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getCategories, getProductTypes } from "@/lib/products"
import { useMemo } from "react"
import { X } from "lucide-react"

interface SearchFiltersProps {
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedTypes: string[] // Added selectedTypes prop
  setSelectedTypes: (types: string[]) => void // Added setSelectedTypes prop
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  maxPriceLimit: number // Dynamic max price based on currency
  priceStep: number // Dynamic step based on currency
  inStock: boolean
  setInStock: (inStock: boolean) => void
  outOfStock: boolean
  setOutOfStock: (outOfStock: boolean) => void
  newArrivalsOnly: boolean
  setNewArrivalsOnly: (newOnly: boolean) => void
  featuredOnly: boolean
  setFeaturedOnly: (featured: boolean) => void
  sortBy: "featured" | "price-low" | "price-high" | "name"
  setSortBy: (sort: "featured" | "price-low" | "price-high" | "name") => void
  isMobile?: boolean
}

export function SearchFilters({
  selectedCategories,
  setSelectedCategories,
  selectedTypes, // Added selectedTypes
  setSelectedTypes, // Added setSelectedTypes
  priceRange,
  setPriceRange,
  maxPriceLimit,
  priceStep,
  inStock,
  setInStock,
  outOfStock,
  setOutOfStock,
  newArrivalsOnly,
  setNewArrivalsOnly,
  featuredOnly,
  setFeaturedOnly,
  sortBy,
  setSortBy,
  isMobile = false,
}: SearchFiltersProps) {
  const categories = getCategories()

  const availableTypes = useMemo(() => {
    if (selectedCategories.length === 0) {
      return getProductTypes()
    }
    const types = selectedCategories.flatMap((category) => getProductTypes(category))
    return Array.from(new Set(types)).sort()
  }, [selectedCategories])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(
      selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category],
    )
  }

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type])
  }

  const handleMinPriceChange = (value: string) => {
    const numValue = Number.parseInt(value) || 0
    const clampedValue = Math.max(0, Math.min(numValue, priceRange[1]))
    setPriceRange([clampedValue, priceRange[1]])
  }

  const handleMaxPriceChange = (value: string) => {
    const numValue = Number.parseInt(value) || maxPriceLimit
    const clampedValue = Math.max(priceRange[0], numValue)
    setPriceRange([priceRange[0], clampedValue])
  }

  const handleClearFilters = () => {
    setSelectedCategories([])
    setSelectedTypes([])
    setPriceRange([0, maxPriceLimit])
    setInStock(false)
    setOutOfStock(false)
    setNewArrivalsOnly(false)
    setFeaturedOnly(false)
    setSortBy("featured")
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedTypes.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPriceLimit ||
    inStock ||
    outOfStock ||
    newArrivalsOnly ||
    featuredOnly ||
    sortBy !== "featured"

  return (
    <div className={isMobile ? "space-y-8 pb-4" : "space-y-4"}>
      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="w-full gap-2"
        >
          <X className="h-4 w-4" />
          Clear All Filters
        </Button>
      )}

      {/* Sort by */}
      <div>
        <Label className="text-base font-semibold mb-2 block">Sort By</Label>
        <RadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <div className="flex items-center space-x-3 py-1.5">
            <RadioGroupItem value="featured" id="featured" />
            <Label htmlFor="featured" className="font-normal cursor-pointer text-base">
              Featured
            </Label>
          </div>
          <div className="flex items-center space-x-3 py-1.5">
            <RadioGroupItem value="price-low" id="price-low" />
            <Label htmlFor="price-low" className="font-normal cursor-pointer text-base">
              Price: Low to High
            </Label>
          </div>
          <div className="flex items-center space-x-3 py-1.5">
            <RadioGroupItem value="price-high" id="price-high" />
            <Label htmlFor="price-high" className="font-normal cursor-pointer text-base">
              Price: High to Low
            </Label>
          </div>
          <div className="flex items-center space-x-3 py-1.5">
            <RadioGroupItem value="name" id="name" />
            <Label htmlFor="name" className="font-normal cursor-pointer text-base">
              Name
            </Label>
          </div>
        </RadioGroup>
      </div>

      {isMobile && <div className="border-t border-border" />}

      {/* Availability */}
      <div>
        <Label className="text-base font-semibold mb-2 block">Availability</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Checkbox id="in-stock" checked={inStock} onCheckedChange={(checked) => setInStock(!!checked)} />
            <Label htmlFor="in-stock" className="font-normal cursor-pointer text-base">
              In Stock
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="out-of-stock" checked={outOfStock} onCheckedChange={(checked) => setOutOfStock(!!checked)} />
            <Label htmlFor="out-of-stock" className="font-normal cursor-pointer text-base">
              Out of Stock
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="new-arrivals"
              checked={newArrivalsOnly}
              onCheckedChange={(checked) => setNewArrivalsOnly(!!checked)}
            />
            <Label htmlFor="new-arrivals" className="font-normal cursor-pointer text-base">
              New Arrivals Only
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="featured-only"
              checked={featuredOnly}
              onCheckedChange={(checked) => setFeaturedOnly(!!checked)}
            />
            <Label htmlFor="featured-only" className="font-normal cursor-pointer text-base">
              Featured Only
            </Label>
          </div>
        </div>
      </div>

      {isMobile && <div className="border-t border-border" />}

      {/* Categories */}
      <div>
        <Label className="text-base font-semibold mb-2 block">Categories</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-3">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label htmlFor={category} className="font-normal cursor-pointer text-base">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {isMobile && <div className="border-t border-border" />}

      {availableTypes.length > 0 && (
        <>
          <div>
            <Label className="text-base font-semibold mb-2 block">Product Type</Label>
            <div className="space-y-2">
              {availableTypes.map((type) => (
                <div key={type} className="flex items-center space-x-3">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="font-normal cursor-pointer text-base">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {isMobile && <div className="border-t border-border" />}
        </>
      )}

      {/* Price range */}
      <div>
        <Label className="text-base font-semibold mb-2 block">Price Range</Label>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <Input
              type="number"
              min={0}
              max={priceRange[1]}
              value={priceRange[0]}
              onChange={(e) => handleMinPriceChange(e.target.value)}
              className="h-9"
              placeholder="Min"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex-1">
            <Input
              type="number"
              min={priceRange[0]}
              value={priceRange[1]}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              className="h-9"
              placeholder="No limit"
            />
          </div>
        </div>
        <Slider
          min={0}
          max={maxPriceLimit}
          step={priceStep}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="mt-2"
        />
      </div>

    </div>
  )
}
