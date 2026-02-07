"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => onCategoryChange(null)}
        className={cn(
          "transition-colors",
          selectedCategory === null && "bg-foreground text-background hover:bg-foreground/90",
        )}
      >
        All Products
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          onClick={() => onCategoryChange(category)}
          className={cn(
            "transition-colors",
            selectedCategory === category && "bg-foreground text-background hover:bg-foreground/90",
          )}
        >
          {category}
        </Button>
      ))}
    </div>
  )
}
